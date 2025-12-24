import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Colaborador } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useColaboradores = () => {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchColaboradores = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('nome');

      if (error) throw error;
      setColaboradores(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar colaboradores',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createColaborador = async (colaborador: Omit<Colaborador, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .insert([colaborador])
        .select()
        .single();

      if (error) throw error;

      setColaboradores((prev) => [...prev, data]);
      toast({
        title: 'Colaborador criado',
        description: 'Colaborador adicionado com sucesso.',
      });
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao criar colaborador',
        description: error.message,
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const updateColaborador = async (id: string, updates: Partial<Colaborador>) => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setColaboradores((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      );
      toast({
        title: 'Colaborador atualizado',
        description: 'Dados atualizados com sucesso.',
      });
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar colaborador',
        description: error.message,
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const deleteColaborador = async (id: string) => {
    try {
      const { error } = await supabase
        .from('colaboradores')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setColaboradores((prev) => prev.filter((c) => c.id !== id));
      toast({
        title: 'Colaborador removido',
        description: 'Colaborador removido com sucesso.',
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao remover colaborador',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchColaboradores();
  }, [fetchColaboradores]);

  return {
    colaboradores,
    loading,
    fetchColaboradores,
    createColaborador,
    updateColaborador,
    deleteColaborador,
  };
};
