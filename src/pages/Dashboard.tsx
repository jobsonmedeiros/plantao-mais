import {
  ArrowLeftRight,
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  Inbox,
  Building2,
  Clock,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard, type Tone } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role-context";

type ItemMetrica = { label: string; value?: string | number; tone: Tone };

function BlocoMetricas({ itens }: { itens: ItemMetrica[] }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {itens.map((item) => (
        <StatCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
      ))}
    </div>
  );
}

function Painel({
  titulo,
  icone,
  textoVazio,
  children,
}: {
  titulo: string;
  icone: LucideIcon;
  textoVazio?: string;
  children?: ReactNode;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3 border-b border-line bg-surface/40">
        <CardTitle className="text-base font-bold text-ink flex items-center justify-between">
          <span>{titulo}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        {children ? (
          children
        ) : (
          <EmptyState icon={icone} title="Nada para mostrar ainda" text={textoVazio || ""} />
        )}
      </CardContent>
    </Card>
  );
}

function DashboardAdministrador() {
  const itensEstatisticas: ItemMetrica[] = [
    { label: "Instituições ativas", value: 12, tone: "info" },
    { label: "Usuários vinculados", value: 480, tone: "info" },
    { label: "Convites pendentes", value: 18, tone: "warning" },
    { label: "Setores ativos", value: 54, tone: "success" },
  ];

  const instituicoesExemplo = [
    { nome: "Hospital Santa Maria", cidade: "São Paulo - SP", usuarios: 84, status: "Ativo" },
    { nome: "UPA 24h Central", cidade: "Campinas - SP", usuarios: 42, status: "Ativo" },
    { nome: "Clínica São Rafael", cidade: "Santos - SP", usuarios: 26, status: "Em implantação" },
    { nome: "Hospital Metropolitano", cidade: "São Paulo - SP", usuarios: 115, status: "Ativo" },
  ];

  return (
    <>
      <PageHeader
        title="Visão da plataforma"
        description="Instituições clientes e uso geral do Plantão+."
      />
      <BlocoMetricas itens={itensEstatisticas} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Painel titulo="Instituições recentes" icone={Building2}>
          <div className="space-y-3">
            {instituicoesExemplo.map((inst) => (
              <div key={inst.nome} className="flex items-center justify-between p-3 rounded-lg border border-line hover:bg-surface">
                <div>
                  <p className="font-bold text-ink text-sm">{inst.nome}</p>
                  <p className="text-xs text-ink-soft">{inst.cidade} • {inst.usuarios} profissionais</p>
                </div>
                <Badge variant={inst.status === "Ativo" ? "success" : "warning"}>
                  {inst.status}
                </Badge>
              </div>
            ))}
          </div>
        </Painel>

        <Painel titulo="Atividade da plataforma" icone={BarChart3}>
          <div className="space-y-4">
            <div className="p-3 bg-surface rounded-lg border border-line text-sm">
              <p className="font-semibold text-ink">Volume de trocas processadas no mês</p>
              <p className="text-2xl font-bold text-brand mt-1">1.240 <span className="text-xs font-normal text-ink-soft">trocas</span></p>
              <div className="w-full bg-line rounded-full h-2 mt-2">
                <div className="bg-ok h-2 rounded-full" style={{ width: "88%" }} />
              </div>
              <p className="text-xs text-ink-soft mt-1">88% aprovadas sem conflito de escala</p>
            </div>
            <div className="flex items-center justify-between p-3 border border-line rounded-lg text-xs text-ink-soft">
              <span>Disponibilidade dos serviços</span>
              <span className="font-bold text-ok-dark">99.98% operante</span>
            </div>
          </div>
        </Painel>
      </div>
    </>
  );
}

function DashboardGerente() {
  const solicitacoesRecentes = [
    {
      de: "João Lima",
      para: "Maria Costa",
      detalhe: "Troca de 10/11 por 12/11",
      status: "Aguardando gerente",
      variante: "warning" as const,
    },
    {
      de: "Ana Souza",
      para: "Carlos Alves",
      detalhe: "Disponibilização no mural",
      status: "Aguardando colega",
      variante: "info" as const,
    },
    {
      de: "Paula Reis",
      para: "Beatriz Oliveira",
      detalhe: "Troca de 14/11 por 16/11",
      status: "Aprovada",
      variante: "success" as const,
    },
    {
      de: "Rafael Martins",
      para: "Lucas Fernandes",
      detalhe: "Troca de 18/11 por 20/11",
      status: "Recusada",
      variante: "danger" as const,
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand">
            <span>Hospital Santa Maria</span>
            <span>•</span>
            <span>Unidade Central</span>
            <span>•</span>
            <span>UTI Adulto</span>
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Visão geral da escala</h1>
          <p className="text-sm text-ink-soft">Acompanhe a cobertura, solicitações de troca e próximos plantões do setor.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/app/escalas">
            <Button variant="outline" size="sm">Ver grade mensal</Button>
          </Link>
          <Link to="/app/aprovacoes">
            <Button size="sm">Fila de aprovações (7)</Button>
          </Link>
        </div>
      </div>

      {/* Indicadores exatos da página 1 e 5 do PDF */}
      <BlocoMetricas
        itens={[
          { label: "Profissionais no setor", value: "48", tone: "info" },
          { label: "Plantões no mês", value: "312", tone: "info" },
          { label: "Trocas pendentes", value: "07", tone: "warning" },
          { label: "Sem cobertura", value: "02", tone: "danger" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Solicitações Recentes */}
        <Painel titulo="Solicitações recentes" icone={ArrowLeftRight}>
          <div className="space-y-3">
            {solicitacoesRecentes.map((solicitacao, indice) => (
              <div key={indice} className="flex items-center justify-between p-3 rounded-lg border border-line hover:bg-surface">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-ink text-sm">
                    <span>{solicitacao.de}</span>
                    <ArrowRight className="h-3 w-3 text-ink-soft" />
                    <span>{solicitacao.para}</span>
                  </div>
                  <p className="text-xs text-ink-soft mt-0.5">{solicitacao.detalhe}</p>
                </div>
                <Badge variant={solicitacao.variante} className="text-xs whitespace-nowrap">
                  {solicitacao.status}
                </Badge>
              </div>
            ))}
          </div>
        </Painel>

        {/* Cobertura por Turno (página 5 do PDF) */}
        <Painel titulo="Cobertura por turno" icone={CalendarDays}>
          <div className="space-y-5 py-2">
            <div>
              <div className="flex justify-between text-xs font-bold text-ink mb-1.5">
                <span>Diurno (07h às 19h)</span>
                <span className="text-brand-dark">92% coberto</span>
              </div>
              <div className="h-3 w-full rounded-full bg-line overflow-hidden">
                <div className="h-full rounded-full bg-brand transition-all" style={{ width: "92%" }} />
              </div>
              <p className="text-[11px] text-ink-soft mt-1">Meta mínima de 6 enfermeiros por turno atingida</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-ink mb-1.5">
                <span>Noturno (19h às 07h)</span>
                <span className="text-ok-dark">78% coberto</span>
              </div>
              <div className="h-3 w-full rounded-full bg-line overflow-hidden">
                <div className="h-full rounded-full bg-ok transition-all" style={{ width: "78%" }} />
              </div>
              <p className="text-[11px] text-warn-dark font-medium mt-1">⚠️ Falta 1 técnico na escala da próxima sexta</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-ink mb-1.5">
                <span>Fim de semana</span>
                <span className="text-warn-dark">65% coberto</span>
              </div>
              <div className="h-3 w-full rounded-full bg-line overflow-hidden">
                <div className="h-full rounded-full bg-warn transition-all" style={{ width: "65%" }} />
              </div>
              <p className="text-[11px] text-danger-dark font-medium mt-1">🚨 2 vagas em aberto no domingo 12/11</p>
            </div>
          </div>
        </Painel>

        {/* Próximos Plantões */}
        <Painel titulo="Plantão de hoje na UTI" icone={ClipboardCheck}>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-surface border border-line">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-brand">Turno Diurno • Em andamento</span>
                <Badge variant="success">Completo</Badge>
              </div>
              <p className="text-sm font-bold text-ink mt-1">07:00 às 19:00 (6 profissionais)</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["Ana Souza (Coord.)", "Maria Costa", "Carlos Alves", "Paula Reis", "Juliana S.", "Roberto M."].map((nome) => (
                  <span key={nome} className="px-2 py-0.5 rounded bg-white text-[11px] font-medium border border-line text-ink">
                    {nome}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface border border-line">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-ink-soft">Turno Noturno • Próximo</span>
                <Badge variant="warning">1 vaga aberta</Badge>
              </div>
              <p className="text-sm font-bold text-ink mt-1">19:00 às 07:00 (5 de 6 previstos)</p>
              <p className="text-xs text-danger-dark mt-1">Necessário remanejar ou convocar substituto.</p>
            </div>
          </div>
        </Painel>
      </div>
    </>
  );
}

function DashboardProfissional() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Olá, João Lima</h1>
          <p className="text-sm text-ink-soft">Hospital Santa Maria • UTI Adulto • COREN-SP 210.450-ENF</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/app/minha-escala">
            <Button size="sm">Ver minha escala completa</Button>
          </Link>
        </div>
      </div>

      <BlocoMetricas
        itens={[
          { label: "Próximo plantão", value: "Amanhã • 07h", tone: "info" },
          { label: "Próxima folga", value: "02/Nov (Seg)", tone: "success" },
          { label: "Plantões no mês", value: "14 plantões", tone: "info" },
          { label: "Solicitações ativas", value: "01 em análise", tone: "warning" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Painel titulo="Seu próximo plantão em destaque" icone={Clock}>
          <div className="rounded-xl border-2 border-brand/20 bg-brand-tint/30 p-5">
            <div className="flex items-center justify-between">
              <Badge variant="info">Turno Diurno</Badge>
              <span className="text-xs font-bold text-brand-dark">Faltam 19 horas</span>
            </div>
            <h3 className="mt-3 text-xl font-extrabold text-ink">31 de Outubro • Terça-feira</h3>
            <p className="text-base font-semibold text-brand-dark">07:00 às 19:00 (12 horas)</p>
            <p className="text-xs text-ink-soft mt-1">Setor: UTI Adulto Geral • Leitos 1 a 10</p>

            <div className="mt-4 flex gap-3 border-t border-line/60 pt-4">
              <Link to="/app/trocar-plantao" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  Propor troca deste plantão
                </Button>
              </Link>
            </div>
          </div>
        </Painel>

        <Painel titulo="Minhas solicitações de troca" icone={Inbox}>
          <div className="space-y-3">
            <div className="p-3.5 rounded-lg border border-line bg-surface">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink">Troca direta com Maria Costa</span>
                <Badge variant="warning">Aguardando Gerência</Badge>
              </div>
              <p className="text-xs text-ink-soft mt-1">
                Seu plantão de <strong className="text-ink">10/Nov (07h-19h)</strong> pelo de Maria em <strong className="text-ink">12/Nov (07h-19h)</strong>.
              </p>
              <p className="text-[11px] text-ok-dark font-medium mt-1">
                ✓ Colega aceitou em 29/10 • Sob análise da Coord. Ana Souza
              </p>
            </div>

            <div className="p-3 rounded-lg border border-dashed border-line text-center text-xs text-ink-soft">
              Precisa folgar em outro dia? Acesse o mural de plantões disponíveis para trocar.
            </div>
          </div>
        </Painel>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { role } = useRole();
  if (role === "admin") return <DashboardAdministrador />;
  if (role === "manager") return <DashboardGerente />;
  return <DashboardProfissional />;
}
