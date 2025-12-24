import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
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
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
