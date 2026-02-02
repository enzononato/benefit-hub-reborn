import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { FullPageLoading } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullPageLoading message="Verificando acesso..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // If no specific roles required, allow any authenticated user
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user has the required role
  if (!userRole || !allowedRoles.includes(userRole)) {
    // RH users should be redirected to /solicitacoes instead of access denied
    if (userRole === 'rh' && location.pathname === '/') {
      return <Navigate to="/solicitacoes" replace />;
    }
    return <Navigate to="/acesso-negado" replace />;
  }

  return <>{children}</>;
}
