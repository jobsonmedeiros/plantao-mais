import { useState, type ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

function LoadingAccess() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-ink-soft">Verificando seu acesso...</p>
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const {
    usuario,
    perfil,
    vinculos,
    carregando,
    erroCarregamento,
    recarregarContexto,
    sair,
  } = useAuth();

  if (carregando) return <LoadingAccess />;

  if (!usuario) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  if (erroCarregamento || !perfil) {
    return (
      <AuthLayout title="Não foi possível verificar seu acesso" subtitle="Seus dados não foram liberados.">
        <div role="alert" className="rounded-md bg-danger-tint p-4 text-sm font-medium text-danger-dark">
          {erroCarregamento ?? "O perfil da conta não foi encontrado."}
        </div>
        <Button
          type="button"
          className="mt-4 w-full"
          onClick={async () => {
            setErroAcao(null);
            const resultado = await recarregarContexto();
            if (resultado.erro) setErroAcao(resultado.erro);
          }}
        >
          Tentar novamente
        </Button>
        {erroAcao && <p role="alert" className="mt-3 text-sm font-medium text-danger-dark">{erroAcao}</p>}
      </AuthLayout>
    );
  }

  if (!perfil.ePlatformAdmin && vinculos.length === 0) {
    return (
      <AuthLayout title="Sua conta ainda não tem vínculo" subtitle="O cadastro, por si só, não libera acesso a uma instituição.">
        <div className="space-y-4">
          <p className="rounded-md border border-line bg-surface p-4 text-sm text-ink-soft">
            Para acessar escalas, você precisa aceitar um convite enviado pela instituição. Abra o link de convite
            recebido por e-mail ou solicite um novo à gerência.
          </p>
          <Link to="/login" className="block text-center text-sm font-semibold text-brand-dark underline">
            Voltar ao login
          </Link>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={async () => {
              setErroAcao(null);
              const resultado = await sair();
              if (resultado.erro) setErroAcao(resultado.erro);
            }}
          >
            Sair da conta
          </Button>
          {erroAcao && <p role="alert" className="text-sm font-medium text-danger-dark">{erroAcao}</p>}
        </div>
      </AuthLayout>
    );
  }

  return children;
}
