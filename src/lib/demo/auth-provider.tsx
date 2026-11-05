import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import {
  AuthContext,
  type ContextoAutenticacaoValor,
  type Papel,
  type PerfilUsuario,
  type VinculoInstitucional,
} from "@/lib/auth-context";

type DemoAuthValue = {
  papel: Papel;
  selecionarPapel: (papel: Papel, entrar?: boolean) => void;
};

const DemoAuthContext = createContext<DemoAuthValue | null>(null);

const opcoesPapel: { value: Papel; label: string }[] = [
  { value: "platform_admin", label: "Administração da plataforma" },
  { value: "institution_admin", label: "Administração da instituição" },
  { value: "manager", label: "Gerência" },
  { value: "professional", label: "Profissional" },
];

function criarUsuarioDemo(): User {
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

function criarContextoDemo(papel: Papel): { perfil: PerfilUsuario; vinculos: VinculoInstitucional[] } {
  const ehPlataforma = papel === "platform_admin";
  const nomePapel = opcoesPapel.find((opcao) => opcao.value === papel)?.label ?? "Demonstração";
  const perfil: PerfilUsuario = {
    id: "demo-user",
    email: "demo@plantao-mais.local",
    nomeCompleto: `Demonstração • ${nomePapel}`,
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
          role: papel === "institution_admin" ? "institution_admin" : papel === "manager" ? "manager" : "professional",
          setores: [
            {
              id: "demo-sector",
              nome: "UTI - Adulto",
              cargo: papel === "professional" ? "Enfermeiro" : "Coordenador",
              eGerente: papel === "manager" || papel === "institution_admin",
            },
          ],
        },
      ];

  return { perfil, vinculos };
}

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [papel, setPapel] = useState<Papel>("manager");
  const [autenticado, setAutenticado] = useState(false);
  const { perfil, vinculos } = useMemo(() => criarContextoDemo(papel), [papel]);
  const usuario = useMemo(() => (autenticado ? criarUsuarioDemo() : null), [autenticado]);
  const valorDemo = useMemo(
    () => ({
      papel,
      selecionarPapel: (novoPapel: Papel, entrar = false) => {
        setPapel(novoPapel);
        if (entrar) setAutenticado(true);
      },
    }),
    [papel],
  );
  const valorAuth: ContextoAutenticacaoValor = {
    usuario,
    sessao: null,
    perfil: autenticado ? perfil : null,
    vinculos: autenticado ? vinculos : [],
    instituicaoAtivaId: autenticado ? vinculos[0]?.institutionId ?? null : null,
    papelAtivo: autenticado ? papel : null,
    carregando: false,
    erroCarregamento: null,
    definirInstituicaoAtiva: () => undefined,
    recarregarContexto: async () => ({}),
    entrar: async () => {
      setAutenticado(true);
      return {};
    },
    cadastrar: async () => ({ erro: "O cadastro não está disponível no modo demonstração." }),
    reenviarConfirmacao: async () => ({ erro: "O reenvio não está disponível no modo demonstração." }),
    sair: async () => {
      setAutenticado(false);
      return {};
    },
    recuperarSenha: async () => ({ erro: "A recuperação não está disponível no modo demonstração." }),
    atualizarSenha: async () => ({ erro: "A alteração de senha não está disponível no modo demonstração." }),
  };

  return (
    <DemoAuthContext.Provider value={valorDemo}>
      <AuthContext.Provider value={valorAuth}>{children}</AuthContext.Provider>
    </DemoAuthContext.Provider>
  );
}

function useDemoAuth() {
  const contexto = useContext(DemoAuthContext);
  if (!contexto) throw new Error("O seletor de demonstração exige o provedor de demonstração.");
  return contexto;
}

export function DemoLoginRoleSelector() {
  const { papel, selecionarPapel } = useDemoAuth();
  return (
    <div className="rounded-md border border-brand/30 bg-brand-tint p-3">
      <label htmlFor="perfil-demo" className="text-sm font-medium">
        Perfil em demonstração
      </label>
      <select
        id="perfil-demo"
        value={papel}
        onChange={(event) => selecionarPapel(event.target.value as Papel, true)}
        className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm"
      >
        {opcoesPapel.map((opcao) => (
          <option key={opcao.value} value={opcao.value}>
            {opcao.label}
          </option>
        ))}
      </select>
      <p role="status" className="mt-3 text-sm font-medium text-brand-dark">
        Ambiente de demonstração: os dados são fictícios e não são persistidos.
      </p>
    </div>
  );
}

export function DemoAppRoleSelector() {
  const { papel, selecionarPapel } = useDemoAuth();
  return (
    <label className="flex min-w-0 items-center gap-2 text-sm text-ink-soft">
      <span className="hidden sm:inline">Perfil</span>
      <select
        aria-label="Perfil em demonstração"
        value={papel}
        onChange={(event) => selecionarPapel(event.target.value as Papel)}
        className="max-w-[10rem] rounded-md border border-line bg-white px-2 py-2 text-sm font-semibold text-ink sm:max-w-[14rem]"
      >
        {opcoesPapel.map((opcao) => (
          <option key={opcao.value} value={opcao.value}>
            {opcao.label}
          </option>
        ))}
      </select>
    </label>
  );
}
