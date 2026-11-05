import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type Papel } from "@/lib/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase";

const opcoesPerfilDemo: { value: Papel; label: string }[] = [
  { value: "platform_admin", label: "Administração da plataforma" },
  { value: "institution_admin", label: "Administração da instituição" },
  { value: "manager", label: "Gerência" },
  { value: "professional", label: "Profissional" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const { entrar, usuario, carregando: carregandoSessao, demoRole, definirDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!carregandoSessao && usuario) return <Navigate to="/app" replace />;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    setMensagemErro(null);

    try {
      const { erro } = await entrar(email, senha);
      if (erro) {
        setMensagemErro(erro);
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

  return (
    <AuthLayout title="Entrar no Plantão+" subtitle="Use o e-mail e a senha da sua conta.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isSupabaseConfigured && (
          <div className="rounded-md border border-brand/30 bg-brand-tint p-3">
            <Label htmlFor="perfil-demo">Perfil em demonstração</Label>
            <select
              id="perfil-demo"
              value={demoRole ?? "manager"}
              onChange={(event) => definirDemoRole(event.target.value as Papel)}
              className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm"
            >
              {opcoesPerfilDemo.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
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

        {!isSupabaseConfigured && (
          <div role="alert" className="rounded-md border border-brand/30 bg-brand-tint p-3 text-sm font-medium text-brand-dark">
            Modo demonstração ativo: você pode alternar entre perfis e navegar como administrador, gerência ou profissional.
          </div>
        )}

        <Button type="submit" className="w-full" disabled={carregando}>
          {carregando ? "Entrando..." : isSupabaseConfigured ? "Entrar" : `Entrar como ${opcoesPerfilDemo.find((opcao) => opcao.value === demoRole)?.label ?? "Gerência"}`}
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
