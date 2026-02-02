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

type SystemRole = 'admin' | 'gestor' | 'agente_dp' | 'rh';

const roleLabels: Record<SystemRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  agente_dp: 'Agente de DP',
  rh: 'RH',
};

// Módulos agregadores (selecionam múltiplos módulos de uma vez)
const AGGREGATE_MODULES = [
  { 
    id: 'convenios', 
    label: 'Convênios',
    includes: ['autoescola', 'farmacia', 'oficina', 'vale_gas', 'papelaria', 'otica'] as BenefitType[]
  },
  { 
    id: 'beneficios', 
    label: 'Benefícios',
    includes: ['plano_odontologico', 'plano_saude', 'vale_transporte'] as BenefitType[]
  },
  { 
    id: 'outros_group', 
    label: 'Outros',
    includes: ['listagem_funcionarios', 'listagem_aniversariantes', 'listagem_dependentes', 'listagem_pdcs', 'informacoes_diversas'] as BenefitType[]
  },
];

// Módulos individuais (DP)
const INDIVIDUAL_MODULES = [
  { id: 'abono_horas' as BenefitType, label: 'Abono de Horas' },
  { id: 'alteracao_ferias' as BenefitType, label: 'Alteração de Férias' },
  { id: 'alteracao_horario' as BenefitType, label: 'Alteração de Horário' },
  { id: 'atestado' as BenefitType, label: 'Atestado' },
  { id: 'aviso_folga_falta' as BenefitType, label: 'Aviso de Folga/Falta' },
  { id: 'contracheque' as BenefitType, label: 'Contracheque' },
  { id: 'operacao_domingo' as BenefitType, label: 'Operação Domingo' },
  { id: 'relatorio_ponto' as BenefitType, label: 'Relatório de Ponto' },
  { id: 'relato_anomalia' as BenefitType, label: 'Relato de Anomalia' },
  { id: 'outros' as BenefitType, label: 'Outros' },
];

// All individual module IDs for operations
const ALL_MODULE_IDS = [
  ...AGGREGATE_MODULES.flatMap(a => a.includes),
  ...INDIVIDUAL_MODULES.map(m => m.id),
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

  // Toggle aggregate module (adds/removes all included modules)
  const handleToggleAggregate = (aggregate: typeof AGGREGATE_MODULES[0]) => {
    const allIncluded = aggregate.includes.every(id => selectedModules.includes(id));
    if (allIncluded) {
      // Remove all
      setSelectedModules(prev => prev.filter(m => !aggregate.includes.includes(m as BenefitType)));
    } else {
      // Add all missing
      setSelectedModules(prev => {
        const newModules = [...prev];
        aggregate.includes.forEach(id => {
          if (!newModules.includes(id)) {
            newModules.push(id);
          }
        });
        return newModules;
      });
    }
  };

  // Check if aggregate is fully selected
  const isAggregateSelected = (aggregate: typeof AGGREGATE_MODULES[0]) => {
    return aggregate.includes.every(id => selectedModules.includes(id));
  };

  const handleSelectAll = () => {
    setSelectedModules(ALL_MODULE_IDS);
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

      // Insert new permissions (only valid individual module IDs, not aggregates)
      const validModulesToSave = selectedModules.filter(m => 
        ALL_MODULE_IDS.includes(m as BenefitType)
      );

      if (validModulesToSave.length > 0) {
        const newPermissions = validModulesToSave.map(module => ({
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
              <SelectItem value="rh">RH</SelectItem>
              <SelectItem value="gestor">Gestor</SelectItem>
              <SelectItem value="agente_dp">Agente de DP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Modules Section - Somente para não-admins */}
        {selectedRole !== 'admin' ? (
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
              <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto py-1">
                {/* Aggregate Modules (Convênios, Benefícios) */}
                {AGGREGATE_MODULES.map((aggregate) => (
                  <label
                    key={aggregate.id}
                    className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={isAggregateSelected(aggregate)}
                      onCheckedChange={() => handleToggleAggregate(aggregate)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-sm text-foreground">{aggregate.label}</span>
                  </label>
                ))}

                {/* Individual Modules (DP) */}
                {INDIVIDUAL_MODULES.map((module) => (
                  <label
                    key={module.id}
                    className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedModules.includes(module.id)}
                      onCheckedChange={() => handleToggleModule(module.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-sm text-foreground">{module.label}</span>
                  </label>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Selecione os módulos que este usuário poderá visualizar e atender.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Administradores têm acesso total a todos os módulos do sistema.
            </p>
          </div>
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
