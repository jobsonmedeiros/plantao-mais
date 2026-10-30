import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import { AuthProvider } from "@/lib/auth-context";
import { RoleProvider } from "@/lib/role-context";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RoleProvider>
          <App />
        </RoleProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
