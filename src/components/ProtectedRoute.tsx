/**
 * Guarda de rutas protegidas — GS AUTOBAT
 *
 * Redirige a /login si no hay sesión activa, y opcionalmente
 * restringe el acceso a ciertos roles.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/database';

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { isAuthenticated, isLoading, profile } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && profile && !allowedRoles.includes(profile.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
