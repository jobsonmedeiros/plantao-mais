import { useAuth, type Papel } from "@/lib/auth-context";

export type Role = Papel;

export const roleLabels: Record<Role, string> = {
  platform_admin: "Administração da plataforma",
  institution_admin: "Administração da instituição",
  manager: "Gerência",
  professional: "Profissional",
};

export function useRole() {
  return { role: useAuth().papelAtivo };
}
