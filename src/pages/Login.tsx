import { lazy, Suspense, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase";

const DemoLoginRoleSelector = import.meta.env.DEV
  ? lazy(() => import("@/lib/demo/auth-provider").then((modulo) => ({ default: modulo.DemoLoginRoleSelector })))
  : null;

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [podeReenviarConfirmacao, setPodeReenviarConfirmacao] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [mensagemReenvio, setMensagemReenvio] = useState<string | null>(null);
  const { entrar, reenviarConfirmacao, usuario, carregando: carregandoSessao } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const modoDemo = import.meta.env.DEV && !isSupabaseConfigured;

  if (!carregandoSessao && usuario) return <Navigate to="/app" replace />;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    setMensagemErro(null);
    setPodeReenviarConfirmacao(false);
    setMensagemReenvio(null);

    try {
      const resultado = await entrar(email, senha);
      if (resultado.erro) {
        setMensagemErro(resultado.erro);
        setPodeReenviarConfirmacao(Boolean(resultado.precisaConfirmarEmail));
      } else {
        const redirect = new URLSearchParams(location.search).get("redirect");
        const destino = redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : "/app";
        navigate(destino, { replace: true });
      }
    } catch (error) {
      setMensagemErro(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleReenviarConfirmacao() {
    setReenviando(true);
    setMensagemReenvio(null);
    const resultado = await reenviarConfirmacao(email);
    setReenviando(false);
    setMensagemReenvio(
      resultado.erro
        ? resultado.erro
        : "Se o endereço puder receber mensagens, enviaremos um novo link de confirmação.",
    );
  }

  return (
    <AuthLayout title="Entrar no Plantão+" subtitle="Use o e-mail e a senha da sua conta.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {modoDemo && DemoLoginRoleSelector && (
          <Suspense fallback={<p role="status">Carregando demonstração...</p>}>
            <DemoLoginRoleSelector />
          </Suspense>
        )}
        {!isSupabaseConfigured && !import.meta.env.DEV && (
          <div role="alert" className="rounded-md bg-danger-tint p-3 text-sm font-medium text-danger-dark">
            Autenticação indisponível: este ambiente não está conectado ao Supabase.
          </div>
        )}
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu.email@exemplo.com.br"
          />
        </div>
        <div>
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {mensagemErro && (
          <div role="alert" className="rounded-md bg-danger-tint p-3 text-sm text-danger-dark font-medium">
            {mensagemErro}
          </div>
        )}

        {podeReenviarConfirmacao && (
          <div className="space-y-2">
            <Button type="button" variant="outline" className="w-full" disabled={reenviando} onClick={handleReenviarConfirmacao}>
              {reenviando ? "Enviando..." : "Reenviar confirmação de e-mail"}
            </Button>
            {mensagemReenvio && <p role="status" className="text-sm text-ink-soft">{mensagemReenvio}</p>}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={carregando}>
          {carregando ? "Entrando..." : modoDemo ? "Entrar na demonstração" : "Entrar"}
        </Button>

        <p className="text-center text-sm">
          <Link to="/recuperar-senha" className="font-semibold text-brand-dark underline">
            Esqueci minha senha
          </Link>
        </p>
        <p className="text-center text-sm text-ink-soft">
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="font-semibold text-brand-dark underline">
            Criar cadastro
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
