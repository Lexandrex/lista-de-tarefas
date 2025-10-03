import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/app/useAuth";
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const loc = useLocation();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;
  return <>{children}</>;
}
