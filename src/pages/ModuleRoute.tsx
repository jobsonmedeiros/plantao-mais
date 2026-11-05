import { Navigate, useParams } from "react-router-dom";
import { isPathAllowed } from "@/lib/nav";
import { modules } from "@/lib/modules";
import { useRole } from "@/lib/role-context";
import ModulePage from "@/pages/ModulePage";
import InstitutionsPage from "@/pages/InstitutionsPage";
import SchedulesPage from "@/pages/SchedulesPage";
import ProfessionalsPage from "@/pages/ProfessionalsPage";
import SwapsPage from "@/pages/SwapsPage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import ProfilePage from "@/pages/ProfilePage";

// Esta checagem controla a navegação; a autorização dos dados continua no banco (RLS).
export default function ModuleRoute() {
  const { slug = "" } = useParams();
  const { role } = useRole();
  const module = modules[slug];

  if (!role || !module || !isPathAllowed(role, `/app/${slug}`)) return <Navigate to="/app" replace />;
  if (slug === "instituicoes") return <InstitutionsPage />;
  if (slug === "escalas" || slug === "minha-escala" || slug === "escala-colegas") return <SchedulesPage />;
  if (slug === "profissionais") return <ProfessionalsPage />;
  if (slug === "trocas" || slug === "trocar-plantao" || slug === "minhas-solicitacoes") return <SwapsPage />;
  if (slug === "aprovacoes") return <ApprovalsPage />;
  if (slug === "meu-perfil") return <ProfilePage />;
  return <ModulePage module={module} />;
}
