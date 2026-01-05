import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { FullPageLoading } from '@/components/ui/loading-spinner';

export type AppRole = 'admin' | 'gestor' | 'agente_dp' | 'colaborador';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  userName: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  hasAccess: (allowedRoles: AppRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    // Fetch user roles (user may have multiple roles)
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (rolesError || !rolesData || rolesData.length === 0) {
      // Default role when no role is configured / visible for the user
      setUserRole('colaborador');
    } else {
      // Priority: admin > gestor > agente_dp > colaborador
      const rolePriority: AppRole[] = ['admin', 'gestor', 'agente_dp', 'colaborador'];
      const userRoles = rolesData.map((r) => r.role as AppRole);
      const highestRole = rolePriority.find((role) => userRoles.includes(role)) || 'colaborador';
      setUserRole(highestRole);
    }

    // Fetch user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', userId)
      .single();

    if (profileData) {
      setUserName(profileData.full_name);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // On sign in, set loading and fetch user data
          if (event === 'SIGNED_IN') {
            setLoading(true);
            // Defer Supabase calls with setTimeout to prevent deadlock
            setTimeout(async () => {
              await fetchUserData(session.user.id);
              setLoading(false);
            }, 0);
          } else {
            // For other events (TOKEN_REFRESHED, etc), just fetch without loading
            setTimeout(() => {
              fetchUserData(session.user.id);
            }, 0);
          }
        } else {
          setUserRole(null);
          setUserName(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Email ou senha incorretos' };
      }
      return { error: error.message };
    }

    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setUserName(null);
  };

  const hasAccess = (allowedRoles: AppRole[]): boolean => {
    if (!userRole) return false;
    return allowedRoles.includes(userRole);
  };

  if (loading) {
    return <FullPageLoading message="Carregando..." />;
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!session,
      user,
      session,
      userRole,
      userName,
      loading,
      login,
      logout,
      hasAccess
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
