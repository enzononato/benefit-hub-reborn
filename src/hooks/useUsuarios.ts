import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SystemRole = 'admin' | 'gestor' | 'agente_dp';

export interface SystemUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: SystemRole;
  created_at: string;
  modules: string[];
}

export const useUsuarios = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);

  const invokeAdminUserManagement = useCallback(async (body: Record<string, unknown>) => {
    const callOnce = async (accessToken: string) => {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const serverMessage = typeof (data as any)?.error === 'string' ? (data as any).error : null;
      return { data, error, serverMessage };
    };

    const sessionResult = await supabase.auth.getSession();
    const accessToken = sessionResult.data.session?.access_token;

    if (!accessToken) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    let res = await callOnce(accessToken);

    // If unauthorized (common when the access token references a deleted session), try refresh once and retry.
    const status = (res.error as any)?.context?.status ?? (res.error as any)?.status;
    const message = String((res.error as any)?.message ?? '');
    const isUnauthorized = status === 401 || message.includes('401') || res.serverMessage?.toLowerCase().includes('sessão') || res.serverMessage?.toLowerCase().includes('token');

    if (res.error && isUnauthorized) {
      const refresh = await supabase.auth.refreshSession();
      const refreshedToken = refresh.data.session?.access_token;

      if (refresh.error || !refreshedToken) {
        await supabase.auth.signOut();
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      res = await callOnce(refreshedToken);
    }

    if (res.error) {
      throw new Error(res.serverMessage || (res.error as any)?.message || 'Erro ao chamar a função');
    }

    return res.data;
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch only system roles (admin, gestor, agente_dp)
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'gestor', 'agente_dp']);

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) {
        setUsers([]);
        return;
      }

      const systemUserIds = roles.map(r => r.user_id);

      // Fetch profiles only for system users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, email, full_name, created_at')
        .in('user_id', systemUserIds)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch module permissions for all system users
      const { data: permissions, error: permError } = await supabase
        .from('user_module_permissions')
        .select('user_id, module')
        .in('user_id', systemUserIds);

      if (permError) throw permError;

      const usersWithRoles: SystemUser[] = (profiles || [])
        .map((profile) => {
          const userRole = roles.find((r) => r.user_id === profile.user_id);
          const userModules = (permissions || [])
            .filter(p => p.user_id === profile.user_id)
            .map(p => p.module);
          return {
            ...profile,
            role: userRole?.role as SystemRole,
            modules: userModules,
          };
        })
        .filter(u => u.role);

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error('Erro ao carregar usuários', { description: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = async (data: { email: string; password: string; fullName: string; role: SystemRole }) => {
    try {
      const result: any = await invokeAdminUserManagement({
        action: 'create',
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: data.role,
      });

      if (!result?.success) throw new Error(result?.error || 'Erro ao criar usuário');

      toast.success('Usuário criado com sucesso!');
      await fetchUsers();
      return { error: null };
    } catch (error: any) {
      toast.error('Erro ao criar usuário', { description: error.message });
      return { error };
    }
  };

  const updateUserRole = async (userId: string, newRole: SystemRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev =>
        prev.map(u => (u.user_id === userId ? { ...u, role: newRole } : u))
      );
      toast.success('Permissão atualizada com sucesso!');
      return { error: null };
    } catch (error: any) {
      toast.error('Erro ao atualizar permissão', { description: error.message });
      return { error };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const result: any = await invokeAdminUserManagement({
        action: 'delete',
        userId,
      });

      if (!result?.success) throw new Error(result?.error || 'Erro ao remover usuário');

      setUsers(prev => prev.filter(u => u.user_id !== userId));
      toast.success('Usuário removido com sucesso!');
      return { error: null };
    } catch (error: any) {
      toast.error('Erro ao remover usuário', { description: error.message });
      return { error };
    }
  };

  const changePassword = async (userId: string, newPassword: string) => {
    try {
      const result: any = await invokeAdminUserManagement({
        action: 'changePassword',
        userId,
        newPassword,
      });

      if (!result?.success) throw new Error(result?.error || 'Erro ao alterar senha');

      toast.success('Senha alterada com sucesso!');
      return { error: null };
    } catch (error: any) {
      toast.error('Erro ao alterar senha', { description: error.message });
      return { error };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    fetchUsers,
    createUser,
    updateUserRole,
    deleteUser,
    changePassword,
  };
};
