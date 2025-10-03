import { useContext } from "react";
import { AuthContext, type AuthValue } from "./auth-context";

export function useAuth(): AuthValue {
  return useContext(AuthContext);
}

export default useAuth;
