import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type Papel = "admin" | "manager" | "professional";

export type PerfilUsuario = {
  id: string;
  email: string;
  nomeCompleto: string;
  telefone?: string;
  ePlatformAdmin: boolean;
};

export type VinculoInstitucional = {
  id: string;
  institutionId: string;
  institutionName: string;
  role: "institution_admin" | "manager" | "professional";
  status: "active" | "inactive";
  sectorId?: string;
  sectorName?: string;
  position?: string;
};

type ContextoAutenticacaoValor = {
  usuario: User | null;
  sessao: Session | null;
  perfil: PerfilUsuario | null;
  vinculos: VinculoInstitucional[];
  papelAtivo: Papel;
  definirPapelAtivo: (papel: Papel) => void;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<{ erro?: string }>;
  cadastrar: (email: string, senha: string, nomeCompleto: string) => Promise<{ erro?: string }>;
  sair: () => Promise<void>;
  recuperarSenha: (email: string) => Promise<{ erro?: string; sucesso?: boolean }>;
};

const AuthContext = createContext<ContextoAutenticacaoValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [sessao, setSessao] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [vinculos, setVinculos] = useState<VinculoInstitucional[]>([]);
  const [papelAtivo, setPapelAtivo] = useState<Papel>("manager");
  const [carregando, setCarregando] = useState(true);

  // Carrega os dados do perfil e vínculos do banco Supabase
  const carregarDadosUsuario = async (userId: string, email: string) => {
    try {
      // 1. Perfil
      const { data: dadosPerfil } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, is_platform_admin")
        .eq("id", userId)
        .maybeSingle();

      if (dadosPerfil) {
        setPerfil({
          id: dadosPerfil.id,
          email: dadosPerfil.email || email,
          nomeCompleto: dadosPerfil.full_name || email.split("@")[0],
          telefone: dadosPerfil.phone || "",
          ePlatformAdmin: Boolean(dadosPerfil.is_platform_admin),
        });

        if (dadosPerfil.is_platform_admin) {
          setPapelAtivo("admin");
        }
      } else {
        setPerfil({
          id: userId,
          email,
          nomeCompleto: email.split("@")[0],
          ePlatformAdmin: false,
        });
      }

      // 2. Vínculos e Setores
      const { data: dadosVinculos } = await supabase
        .from("memberships")
        .select(`
          id,
          institution_id,
          role,
          status,
          institutions ( name )
        `)
        .eq("user_id", userId)
        .eq("status", "active");

      if (dadosVinculos && dadosVinculos.length > 0) {
        const listaFormatada: VinculoInstitucional[] = dadosVinculos.map((v: any) => ({
          id: v.id,
          institutionId: v.institution_id,
          institutionName: v.institutions?.name || "Hospital",
          role: v.role,
          status: v.status,
        }));

        setVinculos(listaFormatada);

        // Define o papel inicial a partir do primeiro vínculo
        const papelPrincipal = listaFormatada[0].role;
        if (papelPrincipal === "institution_admin") setPapelAtivo("admin");
        else if (papelPrincipal === "manager") setPapelAtivo("manager");
        else setPapelAtivo("professional");
      }
    } catch (err) {
      console.warn("Erro ao carregar dados do usuário Supabase:", err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setCarregando(false);
      return;
    }

    // Inicializa a sessão ativa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
      setUsuario(session?.user ?? null);
      if (session?.user) {
        carregarDadosUsuario(session.user.id, session.user.email ?? "");
      }
      setCarregando(false);
    });

    // Escuta mudanças de autenticação (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, novaSessao) => {
        setSessao(novaSessao);
        setUsuario(novaSessao?.user ?? null);
        if (novaSessao?.user) {
          await carregarDadosUsuario(novaSessao.user.id, novaSessao.user.email ?? "");
        } else {
          setPerfil(null);
          setVinculos([]);
        }
        setCarregando(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const entrar = async (email: string, senha: string) => {
    if (!isSupabaseConfigured) {
      // Modo demonstração local caso Supabase remoto ainda não esteja configurado
      const demoEmail = email.toLowerCase();
      setUsuario({ id: "demo-user", email: demoEmail } as User);
      setPerfil({
        id: "demo-user",
        email: demoEmail,
        nomeCompleto: "Dra. Ana Souza (Demonstração)",
        ePlatformAdmin: false,
      });
      return {};
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      return { erro: error.message };
    }
    return {};
  };

  const cadastrar = async (email: string, senha: string, nomeCompleto: string) => {
    if (!isSupabaseConfigured) {
      return { erro: "Supabase não configurado nas variáveis de ambiente." };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { full_name: nomeCompleto },
      },
    });

    if (error) return { erro: error.message };

    if (data.user) {
      // Cria o registro em public.profiles
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: nomeCompleto,
        email,
      });
    }

    return {};
  };

  const sair = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUsuario(null);
    setSessao(null);
    setPerfil(null);
    setVinculos([]);
    setPapelAtivo("manager");
  };

  const recuperarSenha = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { sucesso: true };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    if (error) return { erro: error.message };
    return { sucesso: true };
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        sessao,
        perfil,
        vinculos,
        papelAtivo,
        definirPapelAtivo: setPapelAtivo,
        carregando,
        entrar,
        cadastrar,
        sair,
        recuperarSenha,
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

