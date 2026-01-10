import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BenefitType, benefitTypeLabels } from '@/types/benefits';

// Módulos disponíveis baseados nos tipos de benefício
const AVAILABLE_MODULES: { id: BenefitType; label: string; emoji: string }[] = [
  // Convênios
  { id: 'autoescola', label: 'Autoescola', emoji: '🚗' },
  { id: 'farmacia', label: 'Farmácia', emoji: '💊' },
  { id: 'oficina', label: 'Oficina', emoji: '🔧' },
  { id: 'vale_gas', label: 'Vale Gás', emoji: '⛽' },
  { id: 'papelaria', label: 'Papelaria', emoji: '📚' },
  { id: 'otica', label: 'Ótica', emoji: '👓' },
  // Benefícios
  { id: 'plano_odontologico', label: 'Plano Odontológico', emoji: '🦷' },
  { id: 'plano_saude', label: 'Plano de Saúde', emoji: '❤️' },
  { id: 'vale_transporte', label: 'Vale Transporte', emoji: '🚌' },
  // DP
  { id: 'alteracao_ferias', label: 'Alteração de Férias', emoji: '🏖️' },
  { id: 'alteracao_horario', label: 'Alteração de Horário', emoji: '🕐' },
  { id: 'atestado', label: 'Atestado', emoji: '🏥' },
  { id: 'aviso_folga_falta', label: 'Aviso de Folga/Falta', emoji: '📋' },
  { id: 'contracheque', label: 'Contracheque', emoji: '💵' },
  { id: 'relatorio_ponto', label: 'Relatório de Ponto', emoji: '📊' },
  { id: 'relato_anomalia', label: 'Relato de Anomalia', emoji: '⚠️' },
  { id: 'outros', label: 'Outros', emoji: '📌' },
];

interface ModulosAcessoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export const ModulosAcessoDialog: React.FC<ModulosAcessoDialogProps> = ({
  open,
  onOpenChange,
  userId,
  userName,
}) => {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch current modules when dialog opens
  useEffect(() => {
    if (open && userId) {
      fetchUserModules();
    }
  }, [open, userId]);

  const fetchUserModules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_module_permissions')
        .select('module')
        .eq('user_id', userId);

      if (error) throw error;

      setSelectedModules(data?.map(d => d.module) || []);
    } catch (error: any) {
      toast.error('Erro ao carregar módulos', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(m => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSelectAll = () => {
    setSelectedModules(AVAILABLE_MODULES.map(m => m.id));
  };

  const handleClearAll = () => {
    setSelectedModules([]);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('user_module_permissions')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insert new permissions
      if (selectedModules.length > 0) {
        const newPermissions = selectedModules.map(module => ({
          user_id: userId,
          module,
        }));

        const { error: insertError } = await supabase
          .from('user_module_permissions')
          .insert(newPermissions);

        if (insertError) throw insertError;
      }

      toast.success('Módulos de acesso atualizados!');
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erro ao salvar módulos', { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Módulos de Acesso</DialogTitle>
          <DialogDescription>
            Configure os módulos que <strong>{userName}</strong> poderá visualizar e atender.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end gap-4 text-sm">
              <button
                onClick={handleSelectAll}
                className="text-primary hover:underline"
              >
                Selecionar todos
              </button>
              <button
                onClick={handleClearAll}
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                Limpar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto py-2">
              {AVAILABLE_MODULES.map((module) => (
                <label
                  key={module.id}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedModules.includes(module.id)}
                    onCheckedChange={() => handleToggleModule(module.id)}
                  />
                  <span className="text-base">{module.emoji}</span>
                  <span className="text-sm text-foreground">{module.label}</span>
                </label>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Selecione os módulos que este usuário poderá visualizar e atender.
            </p>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
