import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Calendar,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  Hourglass,
  Search,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Visão de GERÊNCIA sobre as trocas do setor.
 *
 * Esta tela não permite propor troca: quem propõe é o profissional, sobre o
 * próprio plantão (`create_swap_request` exige `membership_id` do solicitante).
 * Aqui a gerência acompanha o andamento e é encaminhada para a decisão em
 * `/app/aprovacoes`, que é onde `decide_swap` é chamado.
 *
 * Enquanto as telas não estiverem ligadas ao backend (item FE-01 do CLAUDE.md),
 * os dados abaixo são fictícios e a tela diz isso explicitamente.
 */

type StatusTroca = "pending" | "awaiting_manager" | "approved" | "denied" | "cancelled";

type TrocaDoSetor = {
  id: string;
  setor: string;
  modalidade: "direct" | "open";
  solicitante: { nome: string; cargo: string; dataPlantao: string; horario: string };
  taker: { nome: string; cargo: string } | null;
  contrapartida: string | null;
  status: StatusTroca;
  atualizadoEm: string;
};

const statusInfo: Record<
  StatusTroca,
  { rotulo: string; variant: "neutral" | "info" | "success" | "warning" | "danger"; descricao: string }
> = {
  pending: {
    rotulo: "Aguardando colega",
    variant: "info",
    descricao: "O colega ainda não respondeu à proposta.",
  },
  awaiting_manager: {
    rotulo: "Aguardando gerência",
    variant: "warning",
    descricao: "O colega aceitou. A decisão é sua.",
  },
  approved: {
    rotulo: "Aprovada",
    variant: "success",
    descricao: "Os plantões foram trocados na escala oficial.",
  },
  denied: {
    rotulo: "Rejeitada",
    variant: "danger",
    descricao: "A troca foi recusada e a escala não mudou.",
  },
  cancelled: {
    rotulo: "Cancelada",
    variant: "neutral",
    descricao: "O solicitante desistiu antes da decisão.",
  },
};

const trocasIniciais: TrocaDoSetor[] = [
  {
    id: "swap-1042",
    setor: "UTI Adulto",
    modalidade: "direct",
    solicitante: { nome: "João Lima", cargo: "Enfermeiro Plantonista", dataPlantao: "10/Nov (Ter)", horario: "07h às 19h" },
    taker: { nome: "Maria Costa", cargo: "Enfermeira Plantonista" },
    contrapartida: "12/Nov (Qui) • 07h às 19h",
    status: "awaiting_manager",
    atualizadoEm: "Hoje às 09:15",
  },
  {
    id: "swap-1041",
    setor: "UTI Adulto",
    modalidade: "open",
    solicitante: { nome: "Carlos Alves", cargo: "Técnico de Enfermagem", dataPlantao: "08/Nov (Dom)", horario: "19h às 07h" },
    taker: { nome: "Paula Reis", cargo: "Técnica de Enfermagem" },
    contrapartida: null,
    status: "awaiting_manager",
    atualizadoEm: "Ontem às 18:30",
  },
  {
    id: "swap-1039",
    setor: "Pronto Atendimento",
    modalidade: "direct",
    solicitante: { nome: "Rafael Martins", cargo: "Enfermeiro Plantonista", dataPlantao: "15/Nov (Sáb)", horario: "07h às 19h" },
    taker: null,
    contrapartida: null,
    status: "pending",
    atualizadoEm: "Ontem às 14:00",
  },
  {
    id: "swap-1035",
    setor: "UTI Adulto",
    modalidade: "direct",
    solicitante: { nome: "Maria Costa", cargo: "Enfermeira Plantonista", dataPlantao: "05/Nov (Qua)", horario: "07h às 19h" },
    taker: { nome: "Beatriz Oliveira", cargo: "Técnica de Enfermagem" },
    contrapartida: "07/Nov (Sex) • 19h às 07h",
    status: "approved",
    atualizadoEm: "03/Nov às 11:02",
  },
  {
    id: "swap-1031",
    setor: "Bloco Cirúrgico",
    modalidade: "direct",
    solicitante: { nome: "Lucas Fernandes", cargo: "Técnico de Enfermagem", dataPlantao: "02/Nov (Dom)", horario: "19h às 07h" },
    taker: { nome: "Carlos Alves", cargo: "Técnico de Enfermagem" },
    contrapartida: null,
    status: "denied",
    atualizadoEm: "01/Nov às 16:40",
  },
];

const filtros: { valor: "todas" | StatusTroca; rotulo: string }[] = [
  { valor: "todas", rotulo: "Todas" },
  { valor: "awaiting_manager", rotulo: "Aguardando gerência" },
  { valor: "pending", rotulo: "Aguardando colega" },
  { valor: "approved", rotulo: "Aprovadas" },
  { valor: "denied", rotulo: "Rejeitadas" },
];

export default function SwapsOverviewPage() {
  const [trocas] = useState<TrocaDoSetor[]>(trocasIniciais);
  const [filtro, setFiltro] = useState<"todas" | StatusTroca>("todas");
  const [busca, setBusca] = useState("");

  const contadores = useMemo(() => {
    return {
      total: trocas.length,
      aguardandoGerencia: trocas.filter((t) => t.status === "awaiting_manager").length,
      emNegociacao: trocas.filter((t) => t.status === "pending").length,
      concluidas: trocas.filter((t) => t.status === "approved" || t.status === "denied").length,
    };
  }, [trocas]);

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return trocas.filter((troca) => {
      const passaFiltro = filtro === "todas" || troca.status === filtro;
      const passaBusca =
        termo === "" ||
        troca.solicitante.nome.toLowerCase().includes(termo) ||
        (troca.taker?.nome.toLowerCase().includes(termo) ?? false) ||
        troca.setor.toLowerCase().includes(termo);
      return passaFiltro && passaBusca;
    });
  }, [trocas, filtro, busca]);

  return (
    <>
      <PageHeader
        eyebrow={
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Visão da gerência
          </div>
        }
        title="Trocas do setor"
        description="Acompanhe as negociações de troca em andamento. A decisão final acontece em Aprovações."
        action={
          <Badge variant="info" className="gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {contadores.aguardandoGerencia} aguardando decisão
          </Badge>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { rotulo: "No setor", valor: contadores.total, icone: ArrowLeftRight },
          { rotulo: "Aguardando gerência", valor: contadores.aguardandoGerencia, icone: Hourglass },
          { rotulo: "Em negociação", valor: contadores.emNegociacao, icone: Send },
          { rotulo: "Concluídas", valor: contadores.concluidas, icone: CheckCircle2 },
        ].map(({ rotulo, valor, icone: Icone }) => (
          <Card key={rotulo}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <Icone className="h-3.5 w-3.5" aria-hidden="true" />
                {rotulo}
              </div>
              <p className="mt-1 text-2xl font-bold text-ink">{valor}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-5">
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-sm">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
              aria-hidden="true"
            />
            <Input
              placeholder="Profissional ou setor"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              className="pl-9"
              aria-label="Buscar troca por profissional ou setor"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filtros.map(({ valor, rotulo }) => (
              <button
                key={valor}
                type="button"
                onClick={() => setFiltro(valor)}
                aria-pressed={filtro === valor}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filtro === valor
                    ? "border-brand bg-brand-tint text-brand-dark"
                    : "border-line bg-white text-ink-soft hover:bg-surface"
                }`}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {listaFiltrada.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-ink-soft">
            <ArrowLeftRight className="mx-auto h-8 w-8 text-ink-soft/40" aria-hidden="true" />
            <p className="mt-2 font-medium">Nenhuma troca com esses filtros.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {listaFiltrada.map((troca) => {
            const info = statusInfo[troca.status];
            return (
              <Card key={troca.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="neutral" className="text-[11px]">
                          {troca.modalidade === "direct" ? "Troca direta" : "Mural aberto"}
                        </Badge>
                        <span className="text-xs font-semibold text-ink-soft">{troca.setor}</span>
                        <span className="text-xs text-ink-soft/70">#{troca.id}</span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="font-bold text-ink">{troca.solicitante.nome}</span>
                        <span className="text-xs text-ink-soft">{troca.solicitante.cargo}</span>
                        <ArrowLeftRight className="h-3.5 w-3.5 text-ink-soft" aria-hidden="true" />
                        {troca.taker ? (
                          <>
                            <span className="font-bold text-ink">{troca.taker.nome}</span>
                            <span className="text-xs text-ink-soft">{troca.taker.cargo}</span>
                          </>
                        ) : (
                          <span className="text-xs italic text-ink-soft">ainda sem interessado</span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                          {troca.solicitante.dataPlantao}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          {troca.solicitante.horario}
                        </span>
                        {troca.contrapartida && (
                          <span className="inline-flex items-center gap-1">
                            <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                            contrapartida: {troca.contrapartida}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-start gap-1 lg:items-end">
                      <Badge variant={info.variant} className="whitespace-nowrap">
                        {troca.status === "approved" && <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
                        {troca.status === "denied" && <XCircle className="h-3 w-3" aria-hidden="true" />}
                        {info.rotulo}
                      </Badge>
                      <p className="text-[11px] text-ink-soft lg:text-right">{info.descricao}</p>
                      <p className="text-[11px] text-ink-soft/70">Atualizado em {troca.atualizadoEm}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-5 flex items-start gap-2 rounded-md border border-line bg-surface p-3 text-xs text-ink-soft">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Esta visão é somente de acompanhamento. Aprovar ou rejeitar uma troca é feito em{" "}
          <a href="/app/aprovacoes" className="font-semibold text-brand-dark underline">
            Aprovações
          </a>
          , onde a escala oficial é atualizada em uma única transação. Os dados desta tela são
          demonstrativos até a integração com o banco.
        </span>
      </p>
    </>
  );
}
