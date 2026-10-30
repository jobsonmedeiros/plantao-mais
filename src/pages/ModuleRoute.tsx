import { Navigate, useParams } from "react-router-dom";
import { isPathAllowed } from "@/lib/nav";
import { modules } from "@/lib/modules";
import { useRole } from "@/lib/role-context";
import ModulePage from "@/pages/ModulePage";
import SchedulesPage from "@/pages/SchedulesPage";
import ProfessionalsPage from "@/pages/ProfessionalsPage";
import SwapsPage from "@/pages/SwapsPage";
import ApprovalsPage from "@/pages/ApprovalsPage";

// Etapa 1: o menu já esconde o que o perfil não vê, mas esta checagem é só de navegação.
// A autorização real de acesso é feita no banco (RLS), a partir da Etapa 2.
export default function ModuleRoute() {
  const { slug = "" } = useParams();
  const { role } = useRole();
  const module = modules[slug];

  if (!module || !isPathAllowed(role, `/app/${slug}`)) return <Navigate to="/app" replace />;
  if (slug === "escalas" || slug === "minha-escala" || slug === "escala-colegas") return <SchedulesPage />;
  if (slug === "profissionais") return <ProfessionalsPage />;
  if (slug === "trocas" || slug === "trocar-plantao" || slug === "minhas-solicitacoes") return <SwapsPage />;
  if (slug === "aprovacoes") return <ApprovalsPage />;
  return <ModulePage module={module} />;
}
