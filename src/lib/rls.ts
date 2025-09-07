import { Navigate, Outlet } from 'react-router-dom';
import { useProfile, useSession, Role } from './auth';

export function RequireAuth() {
  const { data: session, isLoading } = useSession();
  if (isLoading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireRole({ allow }: { allow: Role[] }) {
  const { data: profile, isLoading } = useProfile();
  if (isLoading) return null;
  if (!profile) return <Navigate to="/login" replace />;
  if (!allow.includes(profile.role)) return <div>Not authorized</div>;
  return <Outlet />;
}

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { data: profile } = useProfile();
  if (!profile) return null;
  if (profile.role !== 'admin') return null;
  return <>{children}</>;
}
