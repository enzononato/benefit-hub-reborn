import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SlaConfig {
  id: string;
  benefit_type: string;
  green_hours: number;
  yellow_hours: number;
  created_at: string;
  updated_at: string;
}

export const useSlaConfigs = () => {
  const [configs, setConfigs] = useState<SlaConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sla_configs')
        .select('*')
        .order('benefit_type');

      if (error) throw error;
      setConfigs(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar configurações de SLA', { description: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const createConfig = async (config: { benefit_type: string; green_hours: number; yellow_hours: number }) => {
    try {
      const { data, error } = await supabase
        .from('sla_configs')
        .insert([config])
        .select()
        .single();

      if (error) throw error;

      setConfigs((prev) => [...prev, data].sort((a, b) => a.benefit_type.localeCompare(b.benefit_type)));
      toast.success('Configuração de SLA criada');
      return { data, error: null };
    } catch (error: any) {
      toast.error('Erro ao criar configuração', { description: error.message });
      return { data: null, error };
    }
  };

  const updateConfig = async (id: string, updates: { green_hours?: number; yellow_hours?: number }) => {
    try {
      const { data, error } = await supabase
        .from('sla_configs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setConfigs((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
      toast.success('Configuração de SLA atualizada');
      return { data, error: null };
    } catch (error: any) {
      toast.error('Erro ao atualizar configuração', { description: error.message });
      return { data: null, error };
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      const { error } = await supabase.from('sla_configs').delete().eq('id', id);

      if (error) throw error;

      setConfigs((prev) => prev.filter((c) => c.id !== id));
      toast.success('Configuração de SLA removida');
      return { error: null };
    } catch (error: any) {
      toast.error('Erro ao remover configuração', { description: error.message });
      return { error };
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return {
    configs,
    loading,
    fetchConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
  };
};
