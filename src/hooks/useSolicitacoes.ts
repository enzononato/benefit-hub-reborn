import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Solicitacao } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useSolicitacoes = () => {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSolicitacoes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('*, colaborador:colaboradores(*)')
        .order('data_solicitacao', { ascending: false });

      if (error) throw error;
      setSolicitacoes(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar solicitações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createSolicitacao = async (solicitacao: Omit<Solicitacao, 'id' | 'created_at' | 'updated_at' | 'colaborador' | 'beneficio'>) => {
    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .insert([solicitacao])
        .select('*, colaborador:colaboradores(*)')
        .single();

      if (error) throw error;

      setSolicitacoes((prev) => [data, ...prev]);
      toast({
        title: 'Solicitação criada',
        description: 'Solicitação adicionada com sucesso.',
      });
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao criar solicitação',
        description: error.message,
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const updateSolicitacao = async (id: string, updates: Partial<Solicitacao>) => {
    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .update(updates)
        .eq('id', id)
        .select('*, colaborador:colaboradores(*)')
        .single();

      if (error) throw error;

      setSolicitacoes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...data } : s))
      );
      toast({
        title: 'Solicitação atualizada',
        description: 'Status atualizado com sucesso.',
      });
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar solicitação',
        description: error.message,
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const deleteSolicitacao = async (id: string) => {
    try {
      const { error } = await supabase
        .from('solicitacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSolicitacoes((prev) => prev.filter((s) => s.id !== id));
      toast({
        title: 'Solicitação removida',
        description: 'Solicitação removida com sucesso.',
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao remover solicitação',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchSolicitacoes();
  }, [fetchSolicitacoes]);

  return {
    solicitacoes,
    loading,
    fetchSolicitacoes,
    createSolicitacao,
    updateSolicitacao,
    deleteSolicitacao,
  };
};
