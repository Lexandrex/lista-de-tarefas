import { ReactNode } from "react";
import { useAuth } from "@/app/useAuth";

type RoleGateProps = {
  required: "admin" | "user";
  children: ReactNode;
};

export function RoleGate({ required, children }: RoleGateProps) {
  const { user, profile } = useAuth();

  if (required === "admin") {
    return profile?.is_admin ? <>{children}</> : null;
  }
  // required === "user"
  return user ? <>{children}</> : null;
}
