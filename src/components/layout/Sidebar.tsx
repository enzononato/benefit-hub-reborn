import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Settings,
  LogOut,
  Moon,
  Sun,
  UserCog,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { NotificationDropdown } from './NotificationDropdown';
import revalleLogo from '@/assets/revalle-logo.png';

// Prefetch queries for each route
const routePrefetchQueries: Record<string, string[]> = {
  '/': ['benefit-requests', 'profiles', 'units', 'holidays'],
  '/solicitacoes': ['benefit-requests', 'profiles', 'units', 'sla-configs', 'holidays'],
  '/colaboradores': ['profiles', 'units'],
  '/unidades': ['units'],
  '/usuarios': ['user-roles', 'profiles'],
  '/configuracoes': ['sla-configs', 'holidays', 'partnerships'],
  '/auditoria': ['logs'],
};

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  showOpenCount?: boolean;
  allowedRoles: AppRole[];
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    allowedRoles: ['admin', 'gestor', 'agente_dp']
  },
  {
    name: 'Protocolos',
    href: '/solicitacoes',
    icon: FileText,
    showOpenCount: true,
    allowedRoles: ['admin', 'gestor', 'agente_dp']
  },
  {
    name: 'Colaboradores',
    href: '/colaboradores',
    icon: Users,
    allowedRoles: ['admin', 'gestor', 'agente_dp']
  },
  {
    name: 'Unidades',
    href: '/unidades',
    icon: Building2,
    allowedRoles: ['admin', 'gestor']
  },
  {
    name: 'Usuários',
    href: '/usuarios',
    icon: UserCog,
    allowedRoles: ['admin']
  },
  {
    name: 'Auditoria',
    href: '/auditoria',
    icon: ClipboardList,
    allowedRoles: ['admin']
  },
  {
    name: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    badge: 'Em Dev',
    allowedRoles: ['admin']
  },
];

const roleLabels: Record<AppRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  agente_dp: 'Agente de DP',
  rh: 'RH',
  colaborador: 'Colaborador',
};

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();
  const { userName, userRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [openProtocolsCount, setOpenProtocolsCount] = useState(0);
  const queryClient = useQueryClient();

  // Prefetch data when hovering over navigation links
  const handlePrefetch = useCallback((href: string) => {
    const queryKeys = routePrefetchQueries[href];
    if (queryKeys) {
      queryKeys.forEach(key => {
        // Just mark queries as stale to trigger background refetch if needed
        queryClient.invalidateQueries({ queryKey: [key], refetchType: 'none' });
      });
    }
  }, [queryClient]);

  useEffect(() => {
    const fetchOpenProtocolsCount = async () => {
      const { count, error } = await supabase
        .from('benefit_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['aberta', 'em_analise']);

      if (!error && count !== null) {
        setOpenProtocolsCount(count);
      }
    };

    fetchOpenProtocolsCount();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('open-protocols-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'benefit_requests' },
        () => fetchOpenProtocolsCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSignOut = async () => {
    await logout();
    toast.success('Você saiu da sua conta');
  };

  const userInitials = userName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const displayName = userName || 'Usuário';
  const displayRole = userRole ? roleLabels[userRole] : 'Colaborador';

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => {
    if (!userRole) return false;
    return item.allowedRoles.includes(userRole);
  });

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <img src={revalleLogo} alt="Revalle" className="h-9 w-9 object-cover rounded-lg" />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-sidebar-foreground truncate">Revalle</h1>
            <p className="text-xs text-sidebar-muted truncate">Gestão de Protocolos</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onNavigate}
                onMouseEnter={() => handlePrefetch(item.href)}
                onFocus={() => handlePrefetch(item.href)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="flex-1 truncate">{item.name}</span>
                {item.showOpenCount && openProtocolsCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
                    {openProtocolsCount}
                  </span>
                )}
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-warning/20 text-warning border border-warning/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-4 space-y-3">
          <div className="flex items-center justify-between px-2">
            <NotificationDropdown />
            <div className="flex items-center gap-1">
              <span className="text-sm text-sidebar-muted">Tema</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4 shrink-0" />
                ) : (
                  <Sun className="h-4 w-4 shrink-0" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg p-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-sm font-semibold">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-xs text-sidebar-muted truncate">{displayRole}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 shrink-0 rounded-md hover:bg-sidebar-accent text-sidebar-muted hover:text-sidebar-foreground transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
