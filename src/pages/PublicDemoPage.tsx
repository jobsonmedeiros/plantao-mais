import { Outlet } from "react-router-dom";
import { DemoAuthProvider } from "@/lib/demo/auth-provider";

export default function PublicDemoPage() {
  return (
    <DemoAuthProvider modoPublico>
      <Outlet />
    </DemoAuthProvider>
  );
}
