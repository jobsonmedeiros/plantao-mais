import { lazy } from "react";
import { Navigate, useParams } from "react-router-dom";
import { isPathAllowed } from "@/lib/nav";
import { modules } from "@/lib/modules";
import { useRole } from "@/lib/role-context";

const ModulePage = lazy(() => import("@/pages/ModulePage"));
const InstitutionsPage = lazy(() => import("@/pages/InstitutionsPage"));
const SchedulesPage = lazy(() => import("@/pages/SchedulesPage"));
const ProfessionalsPage = lazy(() => import("@/pages/ProfessionalsPage"));
const SwapsPage = lazy(() => import("@/pages/SwapsPage"));
const SwapsOverviewPage = lazy(() => import("@/pages/SwapsOverviewPage"));
const ApprovalsPage = lazy(() => import("@/pages/ApprovalsPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));

// Esta checagem controla a navegação; a autorização dos dados continua no banco (RLS).
export default function ModuleRoute() {
  const { slug = "" } = useParams();
  const { role } = useRole();
  const module = modules[slug];

  if (!role || !module || !isPathAllowed(role, `/app/${slug}`)) return <Navigate to="/app" replace />;
  if (slug === "instituicoes") return <InstitutionsPage />;
  if (slug === "escalas" || slug === "minha-escala" || slug === "escala-colegas") return <SchedulesPage />;
  if (slug === "profissionais") return <ProfessionalsPage />;
  // A gerência acompanha as trocas do setor; propor troca é do profissional, sobre o
  // próprio plantão (create_swap_request exige membership do solicitante). Ver FE-06.
  if (slug === "trocas") {
    return role === "manager" || role === "institution_admin" ? <SwapsOverviewPage /> : <SwapsPage />;
  }
  if (slug === "trocar-plantao" || slug === "minhas-solicitacoes") return <SwapsPage />;
  if (slug === "aprovacoes") return <ApprovalsPage />;
  if (slug === "meu-perfil") return <ProfilePage />;
  return <ModulePage module={module} />;
}
