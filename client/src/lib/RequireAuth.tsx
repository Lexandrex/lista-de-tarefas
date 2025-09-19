import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../app/AuthProvider";

export default function RequireAuth() {
  const session = useSession();
  if (session === undefined) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}
