import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { modules } from "@/lib/modules";

const AcceptInvitation = lazy(() => import("@/pages/AcceptInvitation"));
const ApprovalsPage = lazy(() => import("@/pages/ApprovalsPage"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ModulePage = lazy(() => import("@/pages/ModulePage"));
const PublicDemoPage = lazy(() => import("@/pages/PublicDemoPage"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const Login = lazy(() => import("@/pages/Login"));
const ProfessionalsPage = lazy(() => import("@/pages/ProfessionalsPage"));
const Register = lazy(() => import("@/pages/Register"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const SchedulesPage = lazy(() => import("@/pages/SchedulesPage"));
const SwapsPage = lazy(() => import("@/pages/SwapsPage"));
const ModuleRoute = lazy(() => import("@/pages/ModuleRoute"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// A rota /demo é pública por decisão de produto: serve para recrutadores e
// instituições verem a interface sem precisar de conta. Não há guard de papel
// aqui de propósito — o seletor de perfil do demo só filtra opções do menu.
// O DemoAuthProvider garante que os dados são fictícios e não persistidos.
function ModuloDemo({ slug }: { slug: string }) {
  const modulo = modules[slug];
  if (!modulo) return <Navigate to="/demo/app" replace />;
  return <ModulePage module={modulo} />;
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
          <p className="text-sm font-semibold text-ink-soft">Carregando página...</p>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/recuperar-senha" element={<ForgotPassword />} />
        <Route path="/redefinir-senha" element={<ResetPassword />} />
        <Route path="/convite/:token" element={<AcceptInvitation />} />
        <Route path="/demo" element={<PublicDemoPage />}>
          <Route index element={<Navigate to="/demo/app" replace />} />
          <Route path="app" element={<AppShell modoDemoPublico />}>
            <Route index element={<Dashboard />} />
            <Route path="meu-perfil" element={<Navigate to="/demo/app" replace />} />
            <Route path="escalas" element={<SchedulesPage />} />
            <Route path="minha-escala" element={<SchedulesPage />} />
            <Route path="escala-colegas" element={<SchedulesPage />} />
            <Route path="profissionais" element={<ProfessionalsPage />} />
            <Route path="trocas" element={<SwapsPage />} />
            <Route path="trocar-plantao" element={<SwapsPage />} />
            <Route path="minhas-solicitacoes" element={<SwapsPage />} />
            <Route path="aprovacoes" element={<ApprovalsPage />} />
            <Route path="setores" element={<ModuloDemo slug="setores" />} />
            <Route path="relatorios" element={<ModuloDemo slug="relatorios" />} />
            <Route path="configuracoes" element={<ModuloDemo slug="configuracoes" />} />
            <Route path="notificacoes" element={<ModuloDemo slug="notificacoes" />} />
          </Route>
          <Route path="*" element={<Navigate to="/demo/app" replace />} />
        </Route>
        <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="meu-perfil" element={<ProfilePage />} />
          <Route path=":slug" element={<ModuleRoute />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
