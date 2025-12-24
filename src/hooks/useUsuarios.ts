import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  position: string | null;
  departamento: string | null;
  unit_id: string | null;
  unit_name: string | null;
  created_at: string;
  role: AppRole;
  role_id: string;
}

export const useUsuarios = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          cpf,
          phone,
          position,
          departamento,
          unit_id,
          created_at
        `)
        .order('full_name');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role');

      if (rolesError) throw rolesError;

      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('id, name');

      if (unitsError) throw unitsError;

      const unitsMap = new Map(units?.map(u => [u.id, u.name]) || []);
      const rolesMap = new Map(roles?.map(r => [r.user_id, { role: r.role, id: r.id }]) || []);

      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const roleData = rolesMap.get(profile.user_id);
        return {
          ...profile,
          unit_name: profile.unit_id ? unitsMap.get(profile.unit_id) || null : null,
          role: roleData?.role || 'colaborador',
          role_id: roleData?.id || '',
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error('Erro ao carregar usuários', { description: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserRole = async (userId: string, roleId: string, newRole: AppRole) => {
    try {
      if (roleId) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('id', roleId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }

      setUsers(prev =>
        prev.map(u =>
          u.user_id === userId ? { ...u, role: newRole } : u
        )
      );
      toast.success('Papel do usuário atualizado');
      return { error: null };
    } catch (error: any) {
      toast.error('Erro ao atualizar papel', { description: error.message });
      return { error };
    }
  };

  const updateUserProfile = async (profileId: string, updates: {
    full_name?: string;
    phone?: string;
    position?: string;
    departamento?: string;
    unit_id?: string | null;
  }) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId);

      if (error) throw error;

      await fetchUsers();
      toast.success('Perfil atualizado com sucesso');
      return { error: null };
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil', { description: error.message });
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
    updateUserRole,
    updateUserProfile,
  };
};
