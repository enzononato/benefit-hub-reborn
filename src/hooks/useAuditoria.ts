import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, any> | null;
  user_id: string | null;
  created_at: string;
  user_name?: string;
}

export const useAuditoria = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: logsData, error: logsError } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (logsError) throw logsError;

      const userIds = [...new Set((logsData || []).map(l => l.user_id).filter(Boolean))];
      
      let profilesMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        
        profilesMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));
      }

      const logsWithUsers: AuditLog[] = (logsData || []).map(log => ({
        ...log,
        user_name: log.user_id ? profilesMap.get(log.user_id) || 'Usuário desconhecido' : 'Sistema',
      }));

      setLogs(logsWithUsers);
    } catch (error: any) {
      toast.error('Erro ao carregar logs', { description: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    fetchLogs,
  };
};
