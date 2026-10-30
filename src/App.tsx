import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import Dashboard from "@/pages/Dashboard";
import ForgotPassword from "@/pages/ForgotPassword";
import Login from "@/pages/Login";
import AcceptInvitation from "@/pages/AcceptInvitation";
import ModuleRoute from "@/pages/ModuleRoute";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar-senha" element={<ForgotPassword />} />
      <Route path="/convite/:token" element={<AcceptInvitation />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path=":slug" element={<ModuleRoute />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
