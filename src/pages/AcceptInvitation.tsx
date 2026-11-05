import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, Building2, CheckCircle2, Shield } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { MIN_PASSWORD_LENGTH, PASSWORD_REQUIREMENTS, validarSenha } from "@/lib/password";

type DadosConvite = {
  email: string;
  role: string;
  status: string;
  expired: boolean;
  institution: string;
  sector: string | null;
};

function isDadosConvite(value: unknown): value is DadosConvite {
  if (!value || typeof value !== "object") return false;
  const dados = value as Record<string, unknown>;
  return (
    typeof dados.email === "string" &&
    typeof dados.role === "string" &&
    typeof dados.status === "string" &&
    typeof dados.expired === "boolean" &&
    typeof dados.institution === "string" &&
    (typeof dados.sector === "string" || dados.sector === null)
  );
}

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { usuario, cadastrar, reenviarConfirmacao, sair, recarregarContexto } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<DadosConvite | null>(null);
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [processando, setProcessando] = useState(false);
  const [confirmacaoPendente, setConfirmacaoPendente] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [mensagemReenvio, setMensagemReenvio] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregarConvite() {
      if (!token || !isSupabaseConfigured) {
        setErro(
          !token
            ? "Token de convite não informado."
            : "Supabase não configurado. Não é possível validar o convite.",
        );
        setCarregando(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc("get_invitation", { p_token: token });
        if (error) throw error;
        if (!isDadosConvite(data)) {
          throw new Error("Convite não encontrado ou indisponível.");
        }
        if (ativo) {
          setDados(data);
          setNome(data.email.split("@")[0]);
        }
      } catch (error) {
        if (ativo) {
          setErro(error instanceof Error ? error.message : "Não foi possível validar o convite.");
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarConvite();
    return () => {
      ativo = false;
    };
  }, [token]);

  async function handleReenviarConfirmacao() {
    if (!dados || !token) return;

    setReenviando(true);
    setMensagemReenvio(null);
    const resultado = await reenviarConfirmacao(
      dados.email,
      `${window.location.origin}/convite/${token}`,
    );
    setReenviando(false);
    setMensagemReenvio(
      resultado.erro
        ? resultado.erro
        : "Se o endereço puder receber mensagens, enviaremos um novo link de confirmação.",
    );
  }

  async function aceitarConvite() {
    if (!token) {
      setErro("Token de convite não informado.");
      return;
    }

    setProcessando(true);
    setErro(null);
    try {
      const { error: erroAceite } = await supabase.rpc("accept_invitation", { p_token: token });
      if (erroAceite) throw erroAceite;
      const resultadoContexto = await recarregarContexto();
      if (resultadoContexto.erro) throw new Error(resultadoContexto.erro);
      navigate("/app", { replace: true });
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível aceitar o convite.");
    } finally {
      setProcessando(false);
    }
  }

  async function handleAceitar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dados) return;

    const erroSenha = validarSenha(senha);
    if (erroSenha) {
      setErro(erroSenha);
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas informadas não coincidem.");
      return;
    }

    setProcessando(true);
    setErro(null);
    try {
      const resultado = await cadastrar(
        dados.email,
        senha,
        nome,
        `${window.location.origin}/convite/${token}`,
      );
      if (resultado.erro) {
        setErro(resultado.erro);
      } else if (resultado.confirmacaoPendente) {
        setConfirmacaoPendente(true);
      } else {
        await aceitarConvite();
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível criar sua conta.");
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return (
      <AuthLayout title="Validando convite..." subtitle="Aguarde enquanto verificamos os dados.">
        <div className="py-12 text-center text-ink-soft" role="status" aria-live="polite">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="mt-4 text-sm font-semibold">Consultando convite institucional...</p>
        </div>
      </AuthLayout>
    );
  }

  if (!dados || dados.expired || dados.status !== "pending") {
    return (
      <AuthLayout title="Convite indisponível" subtitle="Este link não está válido para aceite.">
        <div role="alert" className="flex items-start gap-2 rounded-md bg-danger-tint p-4 text-sm font-medium text-danger-dark">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            {erro ??
              (dados?.expired
                ? "Este convite expirou. Solicite um novo à instituição."
                : "Este convite já foi utilizado ou revogado.")}
          </span>
        </div>
        <Link to="/login" className="mt-4 block text-center text-sm font-semibold text-brand-dark underline">
          Ir para o login
        </Link>
      </AuthLayout>
    );
  }

  if (confirmacaoPendente) {
    return (
      <AuthLayout title="Confirme seu e-mail" subtitle="Precisamos confirmar que este endereço pertence a você.">
        <p role="status" className="rounded-md bg-ok-tint p-4 text-sm font-medium text-ok-dark">
          Enviamos uma mensagem para <strong>{dados.email}</strong>. Use o link enviado para confirmar o endereço e
          retornar a esta página para aceitar o convite.
        </p>
        <Button type="button" variant="outline" className="mt-4 w-full" disabled={reenviando} onClick={handleReenviarConfirmacao}>
          {reenviando ? "Enviando..." : "Reenviar confirmação de e-mail"}
        </Button>
        {mensagemReenvio && (
          <p role="status" className="mt-3 text-sm text-ink-soft">{mensagemReenvio}</p>
        )}
        <p className="mt-4 text-center text-sm">
          Já confirmou?{" "}
          <Link
            to={`/login?redirect=${encodeURIComponent(`/convite/${token}`)}`}
            className="font-semibold text-brand-dark underline"
          >
            Entre na sua conta
          </Link>
        </p>
      </AuthLayout>
    );
  }

  if (usuario && usuario.email?.toLowerCase() !== dados.email.toLowerCase()) {
    return (
      <AuthLayout title="Conta diferente do convite" subtitle={`O convite foi enviado para ${dados.email}.`}>
        <p role="alert" className="rounded-md bg-danger-tint p-4 text-sm font-medium text-danger-dark">
          Você entrou como {usuario.email}. Saia dessa conta e entre com o endereço convidado.
        </p>
        <Button
          type="button"
          className="mt-4 w-full"
          onClick={async () => {
            const resultado = await sair();
            if (resultado.erro) setErro(resultado.erro);
          }}
        >
          Sair da conta
        </Button>
        {erro && <p role="alert" className="mt-3 text-sm text-danger-dark">{erro}</p>}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Ativar seu vínculo"
      subtitle={
        usuario
          ? "Confirme o convite para ativar seu vínculo institucional."
          : "Crie sua conta com o e-mail convidado para ativar o vínculo."
      }
    >
      <div className="mb-6 space-y-3 rounded-xl border border-line bg-surface/60 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-ink">
          <Building2 className="h-4 w-4 text-brand" aria-hidden="true" />
          <span>{dados.institution}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-soft">
          <span>Setor: <strong>{dados.sector || "Não informado"}</strong></span>
          <span className="flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            Papel: {dados.role === "manager"
              ? "Gerência"
              : dados.role === "institution_admin"
                ? "Administrador da instituição"
                : "Profissional"}
          </span>
        </div>
        <p className="text-xs font-semibold text-brand-dark">E-mail convidado: {dados.email}</p>
      </div>

      {usuario ? (
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">Conta autenticada: <strong>{usuario.email}</strong></p>
          {erro && (
            <div role="alert" className="rounded-md bg-danger-tint p-3 text-sm font-medium text-danger-dark">
              {erro}
            </div>
          )}
          <Button type="button" className="w-full gap-2" disabled={processando} onClick={() => void aceitarConvite()}>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {processando ? "Ativando..." : "Aceitar convite e entrar"}
          </Button>
        </div>
      ) : (
        <>
          <form onSubmit={handleAceitar} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                autoComplete="name"
                required
                value={nome}
                onChange={(event) => setNome(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="senha">Crie sua senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                required
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
              />
              <p className="mt-1 text-sm text-ink-soft">{PASSWORD_REQUIREMENTS}</p>
            </div>
            <div>
              <Label htmlFor="confirmarSenha">Confirme sua senha</Label>
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
            <Button type="submit" className="w-full gap-2" disabled={processando}>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {processando ? "Ativando..." : "Criar conta e aceitar convite"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-ink-soft">
            Já tem conta?{" "}
            <Link
              to={`/login?redirect=${encodeURIComponent(`/convite/${token}`)}`}
              className="font-semibold text-brand-dark underline"
            >
              Entre para aceitar o convite
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
