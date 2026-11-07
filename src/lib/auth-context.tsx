import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { traduzirErroAuth } from "@/lib/auth-errors";
import {
  AuthContext,
  type Papel,
  type PerfilUsuario,
  type ResultadoAuth,
  type SetorVinculado,
  type VinculoInstitucional,
} from "@/lib/auth-contract";

export {
  AuthContext,
  type ContextoAutenticacaoValor,
  type Papel,
  type PerfilUsuario,
  type ResultadoAuth,
  type SetorVinculado,
  type VinculoInstitucional,
} from "@/lib/auth-contract";

function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [sessao, setSessao] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [vinculos, setVinculos] = useState<VinculoInstitucional[]>([]);
  const [instituicaoAtivaId, setInstituicaoAtivaId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const versaoCarregamento = useRef(0);

  const carregarDadosUsuario = useCallback(async (user: User, versao?: number): Promise<string | null> => {
    try {
      const { data: dadosPerfil, error: erroPerfil } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, is_platform_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (erroPerfil) throw erroPerfil;
      if (!dadosPerfil) {
        throw new Error("Seu perfil ainda não está disponível. Tente entrar novamente.");
      }

      const { data: dadosVinculos, error: erroVinculos } = await supabase
        .from("memberships")
        .select("id, institution_id, role")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (erroVinculos) throw erroVinculos;

      const vinculosBrutos = dadosVinculos ?? [];
      const instituicaoIds = [...new Set(vinculosBrutos.map((vinculo) => vinculo.institution_id))];
      const vinculoIds = vinculosBrutos.map((vinculo) => vinculo.id);

      const [{ data: instituicoes, error: erroInstituicoes }, { data: setoresMembro, error: erroSetores }] =
        await Promise.all([
          instituicaoIds.length
            ? supabase.from("institutions").select("id, name").in("id", instituicaoIds)
            : Promise.resolve({ data: [], error: null }),
          vinculoIds.length
            ? supabase
                .from("sector_members")
                .select("membership_id, sector_id, position, is_manager")
                .in("membership_id", vinculoIds)
                .eq("status", "active")
            : Promise.resolve({ data: [], error: null }),
        ]);

      if (erroInstituicoes) throw erroInstituicoes;
      if (erroSetores) throw erroSetores;

      const setorIds = [...new Set((setoresMembro ?? []).map((setor) => setor.sector_id))];
      const { data: setores, error: erroDadosSetores } = setorIds.length
        ? await supabase.from("sectors").select("id, name").in("id", setorIds)
        : { data: [], error: null };

      if (erroDadosSetores) throw erroDadosSetores;

      const instituicaoPorId = new Map((instituicoes ?? []).map((instituicao) => [instituicao.id, instituicao.name]));
      const setorPorId = new Map((setores ?? []).map((setor) => [setor.id, setor.name]));
      const setoresPorVinculo = new Map<string, SetorVinculado[]>();

      for (const setor of setoresMembro ?? []) {
        const lista = setoresPorVinculo.get(setor.membership_id) ?? [];
        lista.push({
          id: setor.sector_id,
          nome: setorPorId.get(setor.sector_id) ?? "Setor",
          cargo: setor.position,
          eGerente: setor.is_manager,
        });
        setoresPorVinculo.set(setor.membership_id, lista);
      }

      const listaVinculos: VinculoInstitucional[] = vinculosBrutos.map((vinculo) => ({
        id: vinculo.id,
        institutionId: vinculo.institution_id,
        institutionName: instituicaoPorId.get(vinculo.institution_id) ?? "Instituição",
        role: vinculo.role,
        setores: setoresPorVinculo.get(vinculo.id) ?? [],
      }));

      const novoPerfil: PerfilUsuario = {
        id: dadosPerfil.id,
        email: dadosPerfil.email || user.email || "",
        nomeCompleto: dadosPerfil.full_name || user.email?.split("@")[0] || "Usuário",
        telefone: dadosPerfil.phone ?? "",
        ePlatformAdmin: Boolean(dadosPerfil.is_platform_admin),
      };

      if (versao !== undefined && versao !== versaoCarregamento.current) return null;
      setPerfil(novoPerfil);
      setVinculos(listaVinculos);
      setInstituicaoAtivaId((atual) =>
        atual && listaVinculos.some((vinculo) => vinculo.institutionId === atual)
          ? atual
          : listaVinculos[0]?.institutionId ?? null,
      );
      setErroCarregamento(null);
      return null;
    } catch (error) {
      if (versao !== undefined && versao !== versaoCarregamento.current) return null;
      console.error("Falha ao carregar o perfil e os vínculos do usuário:", error);
      setPerfil(null);
      setVinculos([]);
      setInstituicaoAtivaId(null);
      const mensagem = `Não foi possível carregar seu acesso: ${traduzirErroAuth(error)}`;
      setErroCarregamento(mensagem);
      return mensagem;
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setCarregando(false);
      return;
    }

    let ativo = true;
    let versaoSessao = 0;

    const processarSessao = (novaSessao: Session | null) => {
      const versaoAtual = ++versaoSessao;
      versaoCarregamento.current += 1;
      const versaoDados = versaoCarregamento.current;
      setSessao(novaSessao);
      setUsuario(novaSessao?.user ?? null);
      setErroCarregamento(null);

      if (!novaSessao) {
        setPerfil(null);
        setVinculos([]);
        setInstituicaoAtivaId(null);
        setCarregando(false);
        return;
      }

      setPerfil(null);
      setVinculos([]);
      setCarregando(true);
      queueMicrotask(() => {
        void carregarDadosUsuario(novaSessao.user, versaoDados).finally(() => {
          if (ativo && versaoAtual === versaoSessao) setCarregando(false);
        });
      });
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      processarSessao(novaSessao);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!ativo) return;
      if (error) {
        setErroCarregamento(`Não foi possível verificar sua sessão: ${traduzirErroAuth(error)}`);
        setCarregando(false);
        return;
      }
      processarSessao(data.session);
    }).catch((error: unknown) => {
      if (!ativo) return;
      setErroCarregamento(`Não foi possível verificar sua sessão: ${traduzirErroAuth(error)}`);
      setCarregando(false);
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, [carregarDadosUsuario]);

  const vinculoAtivo = useMemo(
    () => vinculos.find((vinculo) => vinculo.institutionId === instituicaoAtivaId) ?? null,
    [instituicaoAtivaId, vinculos],
  );
  const papelAtivo: Papel | null = perfil?.ePlatformAdmin
    ? "platform_admin"
    : vinculoAtivo?.role ?? null;

  const entrar = async (email: string, senha: string): Promise<ResultadoAuth> => {
    if (!isSupabaseConfigured) return { erro: "A autenticação está indisponível: Supabase não configurado." };

    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
      if (!error) return {};
      const precisaConfirmarEmail = error.code === "email_not_confirmed" || error.message === "Email not confirmed";
      return { erro: traduzirErroAuth(error), precisaConfirmarEmail };
    } catch (error) {
      return { erro: traduzirErroAuth(error) };
    }
  };

  const cadastrar = async (
    email: string,
    senha: string,
    nomeCompleto: string,
    emailRedirectTo = `${window.location.origin}/app`,
  ): Promise<ResultadoAuth> => {
    if (!isSupabaseConfigured) return { erro: "O cadastro está indisponível: Supabase não configurado." };

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: {
          data: { full_name: nomeCompleto.trim() },
          emailRedirectTo,
        },
      });

      if (error) return { erro: traduzirErroAuth(error) };
      return { confirmacaoPendente: !data.session };
    } catch (error) {
      return { erro: traduzirErroAuth(error) };
    }
  };

  const reenviarConfirmacao = async (
    email: string,
    emailRedirectTo = `${window.location.origin}/app`,
  ): Promise<ResultadoAuth> => {
    if (!isSupabaseConfigured) return { erro: "O reenvio está indisponível: Supabase não configurado." };

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo },
      });
      return error ? { erro: traduzirErroAuth(error) } : {};
    } catch (error) {
      return { erro: traduzirErroAuth(error) };
    }
  };

  const sair = async (): Promise<ResultadoAuth> => {
    if (!isSupabaseConfigured) {
      setUsuario(null);
      setPerfil(null);
      setVinculos([]);
      setInstituicaoAtivaId(null);
      setSessao(null);
      setErroCarregamento(null);
      setCarregando(false);
      return {};
    }
    try {
      const { error } = await supabase.auth.signOut();
      return error ? { erro: traduzirErroAuth(error) } : {};
    } catch (error) {
      return { erro: traduzirErroAuth(error) };
    }
  };

  const recuperarSenha = async (email: string): Promise<ResultadoAuth> => {
    if (!isSupabaseConfigured) return { erro: "A recuperação está indisponível: Supabase não configurado." };

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      return error ? { erro: traduzirErroAuth(error) } : {};
    } catch (error) {
      return { erro: traduzirErroAuth(error) };
    }
  };

  const atualizarSenha = async (senha: string): Promise<ResultadoAuth> => {
    if (!isSupabaseConfigured) return { erro: "A alteração está indisponível: Supabase não configurado." };

    try {
      const { data: sessaoAtual, error: erroSessao } = await supabase.auth.getSession();
      if (erroSessao) return { erro: traduzirErroAuth(erroSessao) };
      if (!sessaoAtual.session) {
        return { erro: "O link de redefinição é inválido ou expirou. Solicite um novo link." };
      }

      const { error } = await supabase.auth.updateUser({ password: senha });
      return error ? { erro: traduzirErroAuth(error) } : {};
    } catch (error) {
      return { erro: traduzirErroAuth(error) };
    }
  };

  const recarregarContexto = async (): Promise<ResultadoAuth> => {
    let versao: number | null = null;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) return { erro: traduzirErroAuth(error) };
      if (!data.session) return { erro: "Sua sessão expirou. Entre novamente para continuar." };

      versao = ++versaoCarregamento.current;
      setSessao(data.session);
      setUsuario(data.session.user);
      setCarregando(true);
      const erro = await carregarDadosUsuario(data.session.user, versao);
      return erro ? { erro } : {};
    } catch (error) {
      const mensagem = traduzirErroAuth(error);
      setErroCarregamento(`Não foi possível atualizar seu acesso: ${mensagem}`);
      return { erro: mensagem };
    } finally {
      if (versao === versaoCarregamento.current) setCarregando(false);
    }
  };

  const definirInstituicaoAtiva = (instituicaoId: string) => {
    if (vinculos.some((vinculo) => vinculo.institutionId === instituicaoId)) {
      setInstituicaoAtivaId(instituicaoId);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        sessao,
        perfil,
        vinculos,
        instituicaoAtivaId,
        papelAtivo,
        carregando,
        erroCarregamento,
        definirInstituicaoAtiva,
        recarregarContexto,
        entrar,
        cadastrar,
        reenviarConfirmacao,
        sair,
        recuperarSenha,
        atualizarSenha,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
