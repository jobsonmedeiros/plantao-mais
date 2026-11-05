import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { MIN_PASSWORD_LENGTH, PASSWORD_REQUIREMENTS, validarSenha } from "@/lib/password";

export default function ResetPassword() {
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { atualizarSenha, sessao, carregando: carregandoSessao } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);

    const erroSenha = validarSenha(senha);
    if (erroSenha) {
      setErro(erroSenha);
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas informadas não coincidem.");
      return;
    }

    setCarregando(true);
    try {
      const resultado = await atualizarSenha(senha);
      if (resultado.erro) {
        setErro(resultado.erro);
      } else {
        navigate("/app", { replace: true });
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível alterar a senha.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthLayout
      title="Redefinir senha"
      subtitle="Escolha uma nova senha para sua conta."
    >
      {carregandoSessao ? (
        <p role="status" className="text-sm text-ink-soft">Validando o link de recuperação...</p>
      ) : !sessao ? (
        <div className="space-y-4">
          <p role="alert" className="rounded-md bg-danger-tint p-4 text-sm font-medium text-danger-dark">
            O link de redefinição é inválido ou expirou. Solicite um novo link.
          </p>
          <Link to="/recuperar-senha" className="block text-center text-sm font-semibold text-brand-dark underline">
            Solicitar novo link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="senha">Nova senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
            />
            <p className="mt-1 text-sm text-ink-soft">{PASSWORD_REQUIREMENTS}</p>
          </div>
          <div>
            <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
            <Input
              id="confirmarSenha"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
              value={confirmarSenha}
              onChange={(event) => setConfirmarSenha(event.target.value)}
            />
          </div>
          {erro && (
            <div role="alert" className="rounded-md bg-danger-tint p-3 text-sm font-medium text-danger-dark">
              {erro}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
