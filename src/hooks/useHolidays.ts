import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Holiday {
  id: string;
  date: string;
  name: string;
  created_at: string;
  created_by: string | null;
}

export const useHolidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setHolidays(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar feriados', { description: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const createHoliday = async (holiday: { date: string; name: string }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('holidays')
        .insert([{ ...holiday, created_by: userData.user?.id }])
        .select()
        .single();

      if (error) throw error;

      setHolidays((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));
      toast.success('Feriado adicionado');
      return { data, error: null };
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Esta data já está cadastrada como feriado');
      } else {
        toast.error('Erro ao adicionar feriado', { description: error.message });
      }
      return { data: null, error };
    }
  };

  const updateHoliday = async (id: string, updates: { date?: string; name?: string }) => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setHolidays((prev) => 
        prev.map((h) => (h.id === id ? { ...h, ...data } : h))
          .sort((a, b) => a.date.localeCompare(b.date))
      );
      toast.success('Feriado atualizado');
      return { data, error: null };
    } catch (error: any) {
      toast.error('Erro ao atualizar feriado', { description: error.message });
      return { data: null, error };
    }
  };

  const deleteHoliday = async (id: string) => {
    try {
      const { error } = await supabase.from('holidays').delete().eq('id', id);

      if (error) throw error;

      setHolidays((prev) => prev.filter((h) => h.id !== id));
      toast.success('Feriado removido');
      return { error: null };
    } catch (error: any) {
      toast.error('Erro ao remover feriado', { description: error.message });
      return { error };
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  return {
    holidays,
    loading,
    fetchHolidays,
    createHoliday,
    updateHoliday,
    deleteHoliday,
  };
};

// Função utilitária para obter array de datas de feriados (usado no cálculo de SLA)
export const getHolidayDatesSet = (holidays: Holiday[]): Set<string> => {
  return new Set(holidays.map(h => h.date));
};
