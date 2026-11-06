import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  Home,
  Inbox,
  Layers,
  LayoutDashboard,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/role-context";

export type NavItem = {
  to: string;
  label: string;
  /** Rótulo curto para a barra inferior do celular. */
  short: string;
  icon: LucideIcon;
  /** Aparece direto na barra inferior; os demais vão para "Mais". */
  pin?: boolean;
};

const item = (to: string, label: string, short: string, icon: LucideIcon, pin = false): NavItem => ({
  to,
  label,
  short,
  icon,
  pin,
});

const platformAdminNav: NavItem[] = [
    item("/app", "Dashboard", "Início", LayoutDashboard, true),
    item("/app/instituicoes", "Instituições", "Instituições", Building2, true),
];

const institutionAdminNav: NavItem[] = [
    item("/app", "Dashboard", "Início", LayoutDashboard, true),
    item("/app/setores", "Setores", "Setores", Layers, true),
    item("/app/profissionais", "Profissionais", "Equipe", Users, true),
    item("/app/configuracoes", "Configurações", "Ajustes", Settings),
];

export const navByRole: Record<Role, NavItem[]> = {
  platform_admin: platformAdminNav,
  institution_admin: institutionAdminNav,
  manager: [
    item("/app", "Dashboard", "Início", LayoutDashboard, true),
    item("/app/escalas", "Escalas", "Escalas", CalendarDays, true),
    item("/app/profissionais", "Profissionais", "Equipe", Users),
    item("/app/setores", "Setores", "Setores", Layers),
    item("/app/trocas", "Trocas do setor", "Trocas", ArrowLeftRight, true),
    item("/app/aprovacoes", "Aprovações", "Aprovar", ClipboardCheck, true),
    item("/app/relatorios", "Relatórios", "Relatórios", BarChart3),
    item("/app/configuracoes", "Configurações", "Ajustes", Settings),
  ],
  professional: [
    item("/app", "Início", "Início", Home, true),
    item("/app/minha-escala", "Minha escala", "Escala", CalendarRange, true),
    item("/app/escala-colegas", "Escala dos colegas", "Colegas", Users),
    item("/app/trocar-plantao", "Trocar plantão", "Trocar", ArrowLeftRight, true),
    item("/app/minhas-solicitacoes", "Minhas solicitações", "Pedidos", Inbox, true),
    item("/app/notificacoes", "Notificações", "Avisos", Bell),
    item("/app/meu-perfil", "Meu perfil", "Perfil", UserRound),
  ],
};

/** Rotas que todo perfil pode abrir, além das do próprio menu. */
export const sharedPaths = ["/app/notificacoes", "/app/meu-perfil"];

export function isPathAllowed(role: Role, path: string) {
  return sharedPaths.includes(path) || navByRole[role].some((n) => n.to === path);
}
