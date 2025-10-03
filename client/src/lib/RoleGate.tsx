import { ReactNode } from "react";
import { useAuth } from "@/app/useAuth";

export function RoleGate({ required, children }: { required: "admin" | "user"; children: ReactNode }) {
    const { profile } = useAuth();
    if (required === "admin" && !profile?.is_admin) return null;
    return <>{children}</>;
}
type RoleGateProps = {
  required: "admin" | "user";
  children: ReactNode;
};
