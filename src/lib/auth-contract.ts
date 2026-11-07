import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

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

export type ResultadoAuth = {
  erro?: string;
  confirmacaoPendente?: boolean;
  precisaConfirmarEmail?: boolean;
};

export type ContextoAutenticacaoValor = {
  usuario: User | null;
  sessao: Session | null;
  perfil: PerfilUsuario | null;
  vinculos: VinculoInstitucional[];
  instituicaoAtivaId: string | null;
  papelAtivo: Papel | null;
  carregando: boolean;
  erroCarregamento: string | null;
  definirInstituicaoAtiva: (instituicaoId: string) => void;
  recarregarContexto: () => Promise<ResultadoAuth>;
  entrar: (email: string, senha: string) => Promise<ResultadoAuth>;
  cadastrar: (
    email: string,
    senha: string,
    nomeCompleto: string,
    emailRedirectTo?: string,
  ) => Promise<ResultadoAuth>;
  reenviarConfirmacao: (email: string, emailRedirectTo?: string) => Promise<ResultadoAuth>;
  sair: () => Promise<ResultadoAuth>;
  recuperarSenha: (email: string) => Promise<ResultadoAuth>;
  atualizarSenha: (senha: string) => Promise<ResultadoAuth>;
};

export const AuthContext = createContext<ContextoAutenticacaoValor | null>(null);
