import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Unit {
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export const useUnidades = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnits = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name');

      if (error) throw error;
      setUnits(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar unidades', { description: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const createUnit = async (unit: { name: string; code: string }) => {
    try {
      const { data, error } = await supabase
        .from('units')
        .insert([unit])
        .select()
        .single();

      if (error) throw error;

      setUnits((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success('Unidade criada com sucesso');
      return { data, error: null };
    } catch (error: any) {
      toast.error('Erro ao criar unidade', { description: error.message });
      return { data: null, error };
    }
  };

  const updateUnit = async (id: string, updates: { name?: string; code?: string }) => {
    try {
      const { data, error } = await supabase
        .from('units')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setUnits((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...data } : u)).sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success('Unidade atualizada com sucesso');
      return { data, error: null };
    } catch (error: any) {
      toast.error('Erro ao atualizar unidade', { description: error.message });
      return { data: null, error };
    }
  };

  const deleteUnit = async (id: string) => {
    try {
      const { error } = await supabase.from('units').delete().eq('id', id);

      if (error) throw error;

      setUnits((prev) => prev.filter((u) => u.id !== id));
      toast.success('Unidade removida com sucesso');
      return { error: null };
    } catch (error: any) {
      toast.error('Erro ao remover unidade', { description: error.message });
      return { error };
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  return {
    units,
    loading,
    fetchUnits,
    createUnit,
    updateUnit,
    deleteUnit,
  };
};
