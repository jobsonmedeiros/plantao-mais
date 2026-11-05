import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export default function Register() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [confirmacaoPendente, setConfirmacaoPendente] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { cadastrar, usuario, carregando: carregandoSessao } = useAuth();
  const navigate = useNavigate();

  if (!carregandoSessao && usuario) return <Navigate to="/app" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);

    if (senha.length < 6) {
      setErro("A senha deve conter no mínimo 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas informadas não coincidem.");
      return;
    }

    setCarregando(true);
    try {
      const resultado = await cadastrar(email, senha, nome);
      if (resultado.erro) {
        setErro(resultado.erro);
      } else if (resultado.confirmacaoPendente) {
        setConfirmacaoPendente(true);
      } else {
        navigate("/app", { replace: true });
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível concluir o cadastro.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthLayout
      title={confirmacaoPendente ? "Confirme seu e-mail" : "Criar cadastro"}
      subtitle={
        confirmacaoPendente
          ? "Enviamos as instruções para o endereço informado."
          : "Crie sua conta. O acesso a uma instituição depende de convite."
      }
    >
      {confirmacaoPendente ? (
        <div className="space-y-4">
          <p role="status" className="rounded-md bg-ok-tint p-4 text-sm font-medium text-ok-dark">
            Se o endereço puder receber cadastro, você receberá uma mensagem em <strong>{email}</strong>. Confirme o
            e-mail para continuar. O cadastro não cria vínculo institucional.
          </p>
          <Link to="/login" className="block text-center text-sm font-semibold text-brand-dark underline">
            Voltar para entrar
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              name="name"
              autoComplete="name"
              required
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Seu nome completo"
            />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu.email@exemplo.com.br"
            />
          </div>
          <div>
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              name="new-password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirmarSenha">Confirmar senha</Label>
            <Input
              id="confirmarSenha"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={confirmarSenha}
              onChange={(event) => setConfirmarSenha(event.target.value)}
            />
          </div>

          <p className="rounded-md border border-line bg-surface p-3 text-sm text-ink-soft">
            Criar uma conta não concede acesso a escalas ou instituições. Para isso, aceite um convite institucional.
          </p>

          {erro && (
            <div role="alert" className="rounded-md bg-danger-tint p-3 text-sm font-medium text-danger-dark">
              {erro}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? "Criando conta..." : "Criar conta"}
          </Button>
          <p className="text-center text-sm">
            Já tem uma conta?{" "}
            <Link to="/login" className="font-semibold text-brand-dark underline">
              Entrar
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
