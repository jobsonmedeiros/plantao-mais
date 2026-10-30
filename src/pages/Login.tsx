import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const { entrar } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    setMensagemErro(null);

    const { erro } = await entrar(email, senha);
    setCarregando(false);

    if (erro) {
      setMensagemErro(
        erro.includes("Invalid login credentials")
          ? "E-mail ou senha incorretos."
          : erro
      );
    } else {
      navigate("/app");
    }
  }

  return (
    <AuthLayout title="Entrar no Plantão+" subtitle="Use o e-mail institucional e senha da sua conta.">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="seu.email@hospital.com.br"
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

        <Button type="submit" className="w-full" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </Button>

        <p className="text-center text-sm">
          <Link to="/recuperar-senha" className="font-semibold text-brand-dark underline">
            Esqueci minha senha
          </Link>
        </p>
      </form>

      {!isSupabaseConfigured && (
        <div className="mt-4 rounded-md bg-surface p-3 text-xs text-ink-soft border border-line">
          💡 Modo de demonstração ativo. Você pode digitar qualquer e-mail para navegar ou usar o botão abaixo.
        </div>
      )}

      <div className="mt-6 border-t border-line pt-6">
        <p className="mb-3 text-sm text-ink-soft">Acesso direto ao ambiente:</p>
        <Link to="/app" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
          Acessar painel do sistema
        </Link>
      </div>
    </AuthLayout>
  );
}
