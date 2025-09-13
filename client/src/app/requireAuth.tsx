import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '@/lib/auth';

export default function RequireAuth() {
  const { data: session, isLoading } = useSession();
  if (isLoading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}