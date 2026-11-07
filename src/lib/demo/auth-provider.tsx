import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import {
  AuthContext,
  type ContextoAutenticacaoValor,
  type Papel,
  type PerfilUsuario,
  type VinculoInstitucional,
} from "@/lib/auth-contract";

type DemoAuthValue = {
  papel: Papel;
  opcoesPapel: { value: Papel; label: string }[];
  selecionarPapel: (papel: Papel, entrar?: boolean) => void;
};

const DemoAuthContext = createContext<DemoAuthValue | null>(null);

const opcoesPapel: { value: Papel; label: string }[] = [
  { value: "platform_admin", label: "Administração da plataforma" },
  { value: "institution_admin", label: "Administração da instituição" },
  { value: "manager", label: "Gerência" },
  { value: "professional", label: "Profissional" },
];

const opcoesPapelPublico = opcoesPapel.filter(
  ({ value }) => value === "manager" || value === "professional",
);

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

export function DemoAuthProvider({
  children,
  modoPublico = false,
}: {
  children: ReactNode;
  modoPublico?: boolean;
}) {
  const [papel, setPapel] = useState<Papel>("manager");
  const [autenticado, setAutenticado] = useState(modoPublico);
  const opcoesDisponiveis = modoPublico ? opcoesPapelPublico : opcoesPapel;
  const { perfil, vinculos } = useMemo(() => criarContextoDemo(papel), [papel]);
  const usuario = useMemo(() => (autenticado ? criarUsuarioDemo() : null), [autenticado]);
  const valorDemo = useMemo(
    () => ({
      papel,
      opcoesPapel: opcoesDisponiveis,
      selecionarPapel: (novoPapel: Papel, entrar = false) => {
        if (!opcoesDisponiveis.some((opcao) => opcao.value === novoPapel)) return;
        setPapel(novoPapel);
        if (entrar) setAutenticado(true);
      },
    }),
    [opcoesDisponiveis, papel],
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

export function DemoAppRoleSelector() {
  const { papel, opcoesPapel: opcoes, selecionarPapel } = useDemoAuth();
  return (
    <label className="flex min-w-0 items-center gap-2 text-sm text-ink-soft">
      <span className="hidden sm:inline">Perfil</span>
      <select
        aria-label="Perfil em demonstração"
        value={papel}
        onChange={(event) => {
          const opcao = opcoes.find(({ value }) => value === event.target.value);
          if (opcao) selecionarPapel(opcao.value);
        }}
        className="max-w-[10rem] rounded-md border border-line bg-white px-2 py-2 text-sm font-semibold text-ink sm:max-w-[14rem]"
      >
        {opcoes.map((opcao) => (
          <option key={opcao.value} value={opcao.value}>
            {opcao.label}
          </option>
        ))}
      </select>
    </label>
  );
}
