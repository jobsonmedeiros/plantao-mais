import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { recuperarSenha } = useAuth();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);

    try {
      const res = await recuperarSenha(email);
      if (res.erro) {
        setErro(res.erro);
      } else {
        setSucesso(true);
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível solicitar a recuperação.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Informe o e-mail da sua conta para receber as instruções de redefinição."
    >
      {sucesso ? (
        <div className="space-y-4">
          <div className="rounded-md bg-ok-tint p-4 text-sm text-ok-dark font-medium">
            Se houver uma conta associada a <strong>{email}</strong>, você receberá instruções para redefinir sua senha.
          </div>
          <Link to="/login" className="block text-center text-sm font-semibold text-brand-dark underline">
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail institucional</Label>
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

          {erro && (
            <div className="rounded-md bg-danger-tint p-3 text-sm text-danger-dark font-medium">
              {erro}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? "Enviando..." : "Enviar link de recuperação"}
          </Button>

          <p className="text-center text-sm">
            <Link to="/login" className="font-semibold text-brand-dark underline">
              Voltar para o login
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
