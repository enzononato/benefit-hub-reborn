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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BenefitType } from '@/types/benefits';

type SystemRole = 'admin' | 'gestor' | 'agente_dp';

const roleLabels: Record<SystemRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  agente_dp: 'Agente de DP',
};

// Módulos organizados por categoria
const MODULE_CATEGORIES = {
  convenios: {
    label: 'Convênios',
    modules: [
      { id: 'autoescola' as BenefitType, label: 'Autoescola', emoji: '🚗' },
      { id: 'farmacia' as BenefitType, label: 'Farmácia', emoji: '💊' },
      { id: 'oficina' as BenefitType, label: 'Oficina', emoji: '🔧' },
      { id: 'vale_gas' as BenefitType, label: 'Vale Gás', emoji: '⛽' },
      { id: 'papelaria' as BenefitType, label: 'Papelaria', emoji: '📚' },
      { id: 'otica' as BenefitType, label: 'Ótica', emoji: '👓' },
    ],
  },
  beneficios: {
    label: 'Benefícios',
    modules: [
      { id: 'plano_odontologico' as BenefitType, label: 'Plano Odontológico', emoji: '🦷' },
      { id: 'plano_saude' as BenefitType, label: 'Plano de Saúde', emoji: '❤️' },
      { id: 'vale_transporte' as BenefitType, label: 'Vale Transporte', emoji: '🚌' },
    ],
  },
  dp: {
    label: 'DP',
    modules: [
      { id: 'alteracao_ferias' as BenefitType, label: 'Alteração de Férias', emoji: '🏖️' },
      { id: 'alteracao_horario' as BenefitType, label: 'Alteração de Horário', emoji: '🕐' },
      { id: 'atestado' as BenefitType, label: 'Atestado', emoji: '🏥' },
      { id: 'aviso_folga_falta' as BenefitType, label: 'Aviso de Folga/Falta', emoji: '📋' },
      { id: 'contracheque' as BenefitType, label: 'Contracheque', emoji: '💵' },
      { id: 'relatorio_ponto' as BenefitType, label: 'Relatório de Ponto', emoji: '📊' },
      { id: 'relato_anomalia' as BenefitType, label: 'Relato de Anomalia', emoji: '⚠️' },
      { id: 'outros' as BenefitType, label: 'Outros', emoji: '📌' },
    ],
  },
};

// Flatten all modules for operations
const ALL_MODULES = [
  ...MODULE_CATEGORIES.convenios.modules,
  ...MODULE_CATEGORIES.beneficios.modules,
  ...MODULE_CATEGORIES.dp.modules,
];

interface EditarFuncaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userEmail: string;
  currentRole: SystemRole;
  onRoleUpdated: () => void;
}

export const EditarFuncaoDialog: React.FC<EditarFuncaoDialogProps> = ({
  open,
  onOpenChange,
  userId,
  userName,
  userEmail,
  currentRole,
  onRoleUpdated,
}) => {
  const [selectedRole, setSelectedRole] = useState<SystemRole>(currentRole);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open && userId) {
      setSelectedRole(currentRole);
      fetchUserModules();
    }
  }, [open, userId, currentRole]);

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
    setSelectedModules(ALL_MODULES.map(m => m.id));
  };

  const handleClearAll = () => {
    setSelectedModules([]);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Update role if changed
      if (selectedRole !== currentRole) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: selectedRole })
          .eq('user_id', userId);

        if (roleError) throw roleError;
      }

      // Delete existing module permissions
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

      toast.success('Usuário atualizado com sucesso!');
      onRoleUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erro ao salvar', { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <DialogTitle>Editar Função</DialogTitle>
          </div>
          <DialogDescription>
            Altere a função e os módulos de acesso deste usuário.
          </DialogDescription>
        </DialogHeader>

        {/* User Info */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Usuário</Label>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="font-semibold text-foreground uppercase">{userName}</p>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </div>

        {/* Role Select */}
        <div className="space-y-2">
          <Label>Função</Label>
          <Select
            value={selectedRole}
            onValueChange={(value: SystemRole) => setSelectedRole(value)}
          >
            <SelectTrigger className="border-primary">
              <SelectValue placeholder="Selecione a função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="gestor">Gestor</SelectItem>
              <SelectItem value="agente_dp">Agente de DP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Modules Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Módulos de Acesso</Label>
            <div className="flex items-center gap-4 text-sm">
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
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto py-1">
              {ALL_MODULES.map((module) => (
                <label
                  key={module.id}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedModules.includes(module.id)}
                    onCheckedChange={() => handleToggleModule(module.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="text-base">{module.emoji}</span>
                  <span className="text-sm text-foreground">{module.label}</span>
                </label>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Selecione os módulos que este usuário poderá visualizar e atender.
          </p>
        </div>

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
