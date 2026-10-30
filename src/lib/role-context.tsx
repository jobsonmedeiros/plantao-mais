import { createContext, useContext, type ReactNode } from "react";
import { useAuth, type Papel } from "@/lib/auth-context";

export type Role = Papel;

export const roles: Role[] = ["admin", "manager", "professional"];

export const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  manager: "Gerência",
  professional: "Profissional",
};

type RoleContextValue = { role: Role; setRole: (role: Role) => void };

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { papelAtivo, definirPapelAtivo } = useAuth();

  return (
    <RoleContext.Provider value={{ role: papelAtivo, setRole: definirPapelAtivo }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole deve ser usado dentro de RoleProvider");
  return ctx;
}
