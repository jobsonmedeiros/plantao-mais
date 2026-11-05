import {
  createContext,
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

export type Papel = "platform_admin" | "institution_admin" | "manager" | "professional";

export type PerfilUsuario = {
  id: string;
  email: string;
  nomeCompleto: string;
  telefone: string;
  ePlatformAdmin: boolean;
};

export type SetorVinculado = {
  id: string;
  nome: string;
  cargo: string | null;
  eGerente: boolean;
};

export type VinculoInstitucional = {
  id: string;
  institutionId: string;
  institutionName: string;
  role: Exclude<Papel, "platform_admin">;
  setores: SetorVinculado[];
};

type ResultadoAuth = { erro?: string; confirmacaoPendente?: boolean };

type ContextoAutenticacaoValor = {
  usuario: User | null;
  sessao: Session | null;
  perfil: PerfilUsuario | null;
  vinculos: VinculoInstitucional[];
  instituicaoAtivaId: string | null;
  papelAtivo: Papel | null;
  demoRole: Papel | null;
  carregando: boolean;
  erroCarregamento: string | null;
  definirInstituicaoAtiva: (instituicaoId: string) => void;
  definirDemoRole: (role: Papel) => void;
  recarregarContexto: () => Promise<ResultadoAuth>;
  entrar: (email: string, senha: string) => Promise<ResultadoAuth>;
  cadastrar: (
    email: string,
    senha: string,
    nomeCompleto: string,
    emailRedirectTo?: string,
  ) => Promise<ResultadoAuth>;
  sair: () => Promise<ResultadoAuth>;
  recuperarSenha: (email: string) => Promise<ResultadoAuth>;
  atualizarSenha: (senha: string) => Promise<ResultadoAuth>;
};

const AuthContext = createContext<ContextoAutenticacaoValor | null>(null);
const DEMO_ROLE_STORAGE_KEY = "plantao-mais-demo-role";

function getDemoRoleFromStorage(): Papel {
  const valor = window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY);
  return valor === "platform_admin" || valor === "institution_admin" || valor === "manager" || valor === "professional"
    ? valor
    : "manager";
}

function createDemoUser(_role: Papel): User {
  return {
    id: "demo-user",
    email: "demo@plantao-mais.local",
    app_metadata: { provider: "demo" },
    user_metadata: { full_name: "Modo demonstração" },
    aud: "authenticated",
    created_at: new Date().toISOString(),
    role: "authenticated",
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    phone: "",
    identities: [],
    factors: [],
  } as unknown as User;
}

function createDemoContext(role: Papel) {
  const ehPlataforma = role === "platform_admin";
  const nomeRole = {
    platform_admin: "Administração da plataforma",
    institution_admin: "Administração da instituição",
    manager: "Gerência",
    professional: "Profissional",
  }[role];

  const perfil: PerfilUsuario = {
    id: "demo-user",
    email: "demo@plantao-mais.local",
    nomeCompleto: `Demonstração • ${nomeRole}`,
    telefone: "",
    ePlatformAdmin: ehPlataforma,
  };

  const vinculos: VinculoInstitucional[] = ehPlataforma
    ? []
    : [
        {
          id: "demo-membership",
          institutionId: "demo-institution",
          institutionName: "Hospital Universitário Demo",
          role: role === "institution_admin" ? "institution_admin" : role === "manager" ? "manager" : "professional",
          setores: [
            {
              id: "demo-sector",
              nome: "UTI - Adulto",
              cargo: role === "professional" ? "Enfermeiro" : "Coordenador",
              eGerente: role === "manager" || role === "institution_admin",
            },
          ],
        },
      ];

  return { perfil, vinculos };
}

function mensagemErro(error: unknown) {
  if (!(error instanceof Error)) return "Não foi possível concluir a operação.";

  const mensagens: Record<string, string> = {
    "Invalid login credentials": "E-mail ou senha incorretos.",
    "Email not confirmed": "Confirme seu e-mail antes de entrar.",
    "User already registered": "Este e-mail já possui cadastro. Entre com sua conta.",
    "Password should be at least 6 characters":
      "A senha deve conter no mínimo 6 caracteres.",
  };

  return mensagens[error.message] ?? error.message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [sessao, setSessao] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [vinculos, setVinculos] = useState<VinculoInstitucional[]>([]);
  const [instituicaoAtivaId, setInstituicaoAtivaId] = useState<string | null>(null);
  const [demoRole, setDemoRole] = useState<Papel>(() => getDemoRoleFromStorage());
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const versaoCarregamento = useRef(0);

  const aplicarDemoMode = useCallback((role: Papel) => {
    const { perfil: perfilDemo, vinculos: vinculosDemo } = createDemoContext(role);
    setUsuario(createDemoUser(role));
    setSessao(null);
    setPerfil(perfilDemo);
    setVinculos(vinculosDemo);
    setInstituicaoAtivaId(vinculosDemo[0]?.institutionId ?? null);
    setErroCarregamento(null);
    setCarregando(false);
    window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, role);
  }, []);

  const definirDemoRole = useCallback((role: Papel) => {
    setDemoRole(role);
    if (!isSupabaseConfigured) {
      aplicarDemoMode(role);
    }
  }, [aplicarDemoMode]);

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
      const mensagem = `Não foi possível carregar seu acesso: ${mensagemErro(error)}`;
      setErroCarregamento(mensagem);
      return mensagem;
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const roleInicial = getDemoRoleFromStorage();
      setDemoRole(roleInicial);
      aplicarDemoMode(roleInicial);
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
        setErroCarregamento(`Não foi possível verificar sua sessão: ${mensagemErro(error)}`);
        setCarregando(false);
        return;
      }
      processarSessao(data.session);
    }).catch((error: unknown) => {
      if (!ativo) return;
      setErroCarregamento(`Não foi possível verificar sua sessão: ${mensagemErro(error)}`);
      setCarregando(false);
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, [aplicarDemoMode, carregarDadosUsuario]);

  const vinculoAtivo = useMemo(
    () => vinculos.find((vinculo) => vinculo.institutionId === instituicaoAtivaId) ?? null,
    [instituicaoAtivaId, vinculos],
  );
  const papelAtivo: Papel | null = !isSupabaseConfigured
    ? demoRole
    : perfil?.ePlatformAdmin
      ? "platform_admin"
      : vinculoAtivo?.role ?? null;

  const entrar = async (email: string, senha: string): Promise<ResultadoAuth> => {
    if (!isSupabaseConfigured) {
      const proximoRole = demoRole ?? "manager";
      aplicarDemoMode(proximoRole);
      return {};
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
      return error ? { erro: mensagemErro(error) } : {};
    } catch (error) {
      return { erro: mensagemErro(error) };
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

      if (error) return { erro: mensagemErro(error) };
      return { confirmacaoPendente: !data.session };
    } catch (error) {
      return { erro: mensagemErro(error) };
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
      return error ? { erro: mensagemErro(error) } : {};
    } catch (error) {
      return { erro: mensagemErro(error) };
    }
  };

  const recuperarSenha = async (email: string): Promise<ResultadoAuth> => {
    if (!isSupabaseConfigured) return { erro: "A recuperação está indisponível: Supabase não configurado." };

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      return error ? { erro: mensagemErro(error) } : {};
    } catch (error) {
      return { erro: mensagemErro(error) };
    }
  };

  const atualizarSenha = async (senha: string): Promise<ResultadoAuth> => {
    if (!isSupabaseConfigured) return { erro: "A alteração está indisponível: Supabase não configurado." };

    try {
      const { data: sessaoAtual, error: erroSessao } = await supabase.auth.getSession();
      if (erroSessao) return { erro: mensagemErro(erroSessao) };
      if (!sessaoAtual.session) {
        return { erro: "O link de redefinição é inválido ou expirou. Solicite um novo link." };
      }

      const { error } = await supabase.auth.updateUser({ password: senha });
      return error ? { erro: mensagemErro(error) } : {};
    } catch (error) {
      return { erro: mensagemErro(error) };
    }
  };

  const recarregarContexto = async (): Promise<ResultadoAuth> => {
    let versao: number | null = null;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) return { erro: mensagemErro(error) };
      if (!data.session) return { erro: "Sua sessão expirou. Entre novamente para continuar." };

      versao = ++versaoCarregamento.current;
      setSessao(data.session);
      setUsuario(data.session.user);
      setCarregando(true);
      const erro = await carregarDadosUsuario(data.session.user, versao);
      return erro ? { erro } : {};
    } catch (error) {
      const mensagem = mensagemErro(error);
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
        demoRole,
        carregando,
        erroCarregamento,
        definirInstituicaoAtiva,
        definirDemoRole,
        recarregarContexto,
        entrar,
        cadastrar,
        sair,
        recuperarSenha,
        atualizarSenha,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
