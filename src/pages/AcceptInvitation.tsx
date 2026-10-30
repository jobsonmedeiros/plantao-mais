import { useState, useEffect, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Building2, CheckCircle2, Shield, Stethoscope, AlertCircle } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type DadosConvite = {
  email: string;
  role: string;
  position: string;
  institution_name: string;
  sector_name: string;
};

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<DadosConvite | null>(null);

  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    async function carregarConvite() {
      if (!token) {
        setErro("Token de convite não informado.");
        setCarregando(false);
        return;
      }

      if (!isSupabaseConfigured) {
        setDados({
          email: "novo.profissional@hospital.com.br",
          role: "professional",
          position: "Enfermeiro(a) Plantonista",
          institution_name: "Hospital Santa Maria",
          sector_name: "UTI Adulto",
        });
        setNome("Novo Profissional");
        setCarregando(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc("get_invitation", { p_token: token });
        if (error) {
          setErro(error.message || "Convite inválido ou expirado.");
        } else {
          setDados(data);
          setNome(data.email?.split("@")[0] || "");
        }
      } catch (err: any) {
        setErro("Não foi possível carregar as informações do convite.");
      } finally {
        setCarregando(false);
      }
    }

    carregarConvite();
  }, [token]);

  async function handleAceitar(e: FormEvent) {
    e.preventDefault();
    if (senha !== confirmarSenha) {
      setErro("As senhas informadas não coincidem.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    setProcessando(true);
    setErro(null);

    try {
      if (!isSupabaseConfigured) {
        setTimeout(() => {
          navigate("/app");
        }, 1000);
        return;
      }

      // 1. Cadastra ou faz login no Supabase Auth
      const { error: authError } = await supabase.auth.signUp({
        email: dados!.email,
        password: senha,
        options: { data: { full_name: nome } },
      });

      if (authError && !authError.message.includes("already registered")) {
        throw authError;
      }

      // Se já estava cadastrado, tenta logar
      if (authError?.message.includes("already registered")) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: dados!.email,
          password: senha,
        });
        if (loginError) throw loginError;
      }

      // 2. Chama RPC para aceitar e ativar o vínculo com RLS
      const { error: rpcError } = await supabase.rpc("accept_invitation", { p_token: token });
      if (rpcError) throw rpcError;

      navigate("/app");
    } catch (err: any) {
      setErro(err.message || "Erro ao ativar o vínculo. Tente novamente.");
      setProcessando(false);
    }
  }

  if (carregando) {
    return (
      <AuthLayout title="Validando convite..." subtitle="Aguarde enquanto verificamos suas credenciais.">
        <div className="py-12 text-center text-ink-soft">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="mt-4 text-sm font-semibold">Consultando convite institucional...</p>
        </div>
      </AuthLayout>
    );
  }

  if (erro && !dados) {
    return (
      <AuthLayout title="Convite indisponível" subtitle="Este link não é válido ou já expirou.">
        <div className="space-y-4">
          <div className="rounded-md bg-danger-tint p-4 text-sm text-danger-dark font-medium flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{erro}</span>
          </div>
          <Link to="/login" className="block text-center text-sm font-semibold text-brand-dark underline">
            Ir para a página de login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Ativar seu vínculo"
      subtitle="Complete seu cadastro para começar a usar o Plantão+ na sua instituição."
    >
      {/* Detalhes do Convite Institucional */}
      <div className="mb-6 rounded-xl border border-line bg-surface/60 p-4 space-y-3">
        <div className="flex items-center gap-2 font-bold text-ink text-sm">
          <Building2 className="h-4 w-4 text-brand" />
          <span>{dados?.institution_name}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
          <span className="flex items-center gap-1 font-medium text-ink">
            <Stethoscope className="h-3.5 w-3.5 text-brand" /> {dados?.position || "Enfermagem"}
          </span>
          <span>•</span>
          <span>Setor: <strong>{dados?.sector_name || "Geral"}</strong></span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" />
            Papel: {dados?.role === "manager" ? "Coordenador(a)" : "Profissional"}
          </span>
        </div>
        <div className="text-xs text-brand-dark font-semibold">
          E-mail convidado: {dados?.email}
        </div>
      </div>

      <form onSubmit={handleAceitar} className="space-y-4">
        <div>
          <Label htmlFor="nome">Seu nome completo *</Label>
          <Input
            id="nome"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: João da Silva Lima"
          />
        </div>

        <div>
          <Label htmlFor="senha">Crie sua senha de acesso *</Label>
          <Input
            id="senha"
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div>
          <Label htmlFor="confirmarSenha">Confirme sua senha *</Label>
          <Input
            id="confirmarSenha"
            type="password"
            required
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            placeholder="Repita a senha"
          />
        </div>

        {erro && (
          <div className="rounded-md bg-danger-tint p-3 text-xs text-danger-dark font-medium">
            {erro}
          </div>
        )}

        <Button type="submit" className="w-full gap-2" disabled={processando}>
          {processando ? (
            "Ativando..."
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Aceitar convite e entrar
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
