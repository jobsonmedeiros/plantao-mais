import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  Inbox,
  Layers,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type Stage = number | "v2";

export type ModuleInfo = {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Etapa do roteiro em que a tela passa a funcionar. */
  stage: Stage;
  /** O que a pessoa poderá fazer quando a tela estiver conectada. */
  features: string[];
};

// Telas da Etapa 1: estrutura e navegação. Nenhuma delas lê ou grava dados.
export const modules: Record<string, ModuleInfo> = {
  instituicoes: {
    title: "Instituições",
    description: "Hospitais, clínicas e UPAs atendidos pela plataforma.",
    icon: Building2,
    stage: 3,
    features: ["Cadastrar e editar instituições", "Ativar ou desativar uma instituição", "Convidar o administrador de cada instituição"],
  },
  escalas: {
    title: "Escalas",
    description: "Monte, publique e consulte as escalas mensais de cada setor.",
    icon: CalendarDays,
    stage: 4,
    features: ["Criar a escala do mês por setor", "Lançar plantões, folgas e férias direto na grade", "Publicar a escala para os profissionais autorizados"],
  },
  profissionais: {
    title: "Profissionais",
    description: "Equipe cadastrada, cargos e vínculos com setores.",
    icon: Users,
    stage: 3,
    features: ["Convidar profissionais por e-mail", "Registrar cargo, contato e setor", "Ativar ou desativar vínculos"],
  },
  setores: {
    title: "Setores",
    description: "Unidades e setores da instituição, como UTI e Emergência.",
    icon: Layers,
    stage: 3,
    features: ["Criar unidades e setores", "Definir quem gerencia cada setor", "Pesquisar, editar e desativar setores"],
  },
  trocas: {
    title: "Trocas de plantões",
    description: "Acompanhe as propostas de troca entre profissionais do setor.",
    icon: ArrowLeftRight,
    stage: 5,
    features: ["Ver propostas em andamento e o estado de cada uma", "Consultar o mural de plantões disponíveis", "Acompanhar o histórico das negociações"],
  },
  aprovacoes: {
    title: "Aprovações",
    description: "Trocas aceitas pelos profissionais que aguardam a decisão da gerência.",
    icon: ClipboardCheck,
    stage: 6,
    features: ["Comparar o plantão original e o pretendido", "Aprovar ou rejeitar com justificativa", "Atualizar a escala oficial só depois da aprovação"],
  },
  relatorios: {
    title: "Relatórios",
    description: "Análises sobre a distribuição dos plantões.",
    icon: BarChart3,
    stage: "v2",
    features: ["Distribuição de plantões por profissional", "Cobertura por turno e período", "Trocas aprovadas e rejeitadas"],
  },
  configuracoes: {
    title: "Configurações",
    description: "Preferências da instituição e das regras de escala.",
    icon: Settings,
    stage: 3,
    features: ["Definir fuso horário da instituição", "Configurar cobertura mínima por setor e turno", "Gerenciar tipos de plantão e cores"],
  },
  "minha-escala": {
    title: "Minha escala",
    description: "Seus plantões e folgas do mês.",
    icon: CalendarRange,
    stage: 4,
    features: ["Ver seus plantões em calendário ou lista", "Saber o próximo plantão e a próxima folga", "Escolher um plantão para propor troca"],
  },
  "escala-colegas": {
    title: "Escala dos colegas",
    description: "Escalas dos setores em que você tem autorização de consulta.",
    icon: Users,
    stage: 4,
    features: ["Consultar a grade do mês do seu setor", "Filtrar por colega e por turno", "Encontrar quem está de folga para propor uma troca"],
  },
  "trocar-plantao": {
    title: "Trocar plantão",
    description: "Proponha uma troca a um colega ou ofereça seu plantão no mural.",
    icon: ArrowLeftRight,
    stage: 5,
    features: ["Escolher um plantão seu e um colega", "Oferecer um plantão para quem tiver interesse", "Informar o motivo da troca"],
  },
  "minhas-solicitacoes": {
    title: "Minhas solicitações",
    description: "Propostas que você enviou ou recebeu e o estado de cada uma.",
    icon: Inbox,
    stage: 5,
    features: ["Aceitar ou recusar propostas recebidas", "Cancelar uma solicitação enquanto for possível", "Ver se a gerência aprovou ou negou"],
  },
  notificacoes: {
    title: "Notificações",
    description: "Avisos sobre escalas, trocas e lembretes de plantão.",
    icon: Bell,
    stage: 7,
    features: ["Receber avisos de escala publicada ou alterada", "Ver propostas recebidas e decisões da gerência", "Marcar avisos como lidos e abrir a tela relacionada"],
  },
  "meu-perfil": {
    title: "Meu perfil",
    description: "Seus dados de contato e vínculos com instituições.",
    icon: UserRound,
    stage: 2,
    features: ["Atualizar nome e telefone", "Trocar a senha", "Ver as instituições e setores em que você atua"],
  },
};
