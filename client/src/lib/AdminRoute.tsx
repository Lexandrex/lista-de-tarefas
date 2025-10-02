import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/app/AuthProvider";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, profile } = useAuth();
  const loc = useLocation();

  if (isLoading) return null;
  if (!profile?.is_admin) return <Navigate to="/" replace state={{ from: loc }} />;

  return <>{children}</>;
}
