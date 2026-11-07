import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import App from "@/App";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import "@/index.css";

function Aplicacao() {
  const { pathname } = useLocation();
  const demoPublico = pathname === "/demo" || pathname.startsWith("/demo/");

  return demoPublico ? <App /> : <AuthProvider><App /></AuthProvider>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <Aplicacao />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
