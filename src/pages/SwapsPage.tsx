import { useState } from "react";
import {
  ArrowLeftRight,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type OfertaMural = {
  id: string;
  nomeProfissional: string;
  cargo: string;
  coren: string;
  setor: string;
  dataPlantao: string;
  tipoTurno: "D" | "N";
  horarioPlantao: string;
  observacoes?: string;
  publicadoEm: string;
};

const muralInicial: OfertaMural[] = [
  {
    id: "m-1",
    nomeProfissional: "Maria Costa",
    cargo: "Enfermeira Plantonista",
    coren: "305.120-ENF",
    setor: "UTI Adulto",
    dataPlantao: "05 de Novembro (Quinta)",
    tipoTurno: "D",
    horarioPlantao: "07:00 às 19:00",
    observacoes: "Preciso trocar por qualquer plantão no fim de semana ou dia 06/11.",
    publicadoEm: "Há 2 horas",
  },
  {
    id: "m-2",
    nomeProfissional: "Carlos Alves",
    cargo: "Técnico de Enfermagem",
    coren: "412.980-TE",
    setor: "UTI Adulto",
    dataPlantao: "08 de Novembro (Domingo)",
    tipoTurno: "N",
    horarioPlantao: "19:00 às 07:00",
    observacoes: "Disponível para troca por plantão diurno na mesma semana.",
    publicadoEm: "Ontem às 18:30",
  },
];

type SolicitacaoUsuario = {
  id: string;
  tipo: "direta" | "mural";
  meuPlantao: string;
  plantaoAlvo?: string;
  nomeColega?: string;
  status: "pending_peer" | "awaiting_manager" | "approved" | "rejected";
  rotuloStatus: string;
  atualizadoEm: string;
};

const minhasSolicitacoesIniciais: SolicitacaoUsuario[] = [
  {
    id: "req-1",
    tipo: "direta",
    meuPlantao: "10/Nov (07h às 19h)",
    plantaoAlvo: "12/Nov (07h às 19h)",
    nomeColega: "Maria Costa",
    status: "awaiting_manager",
    rotuloStatus: "Colega aceitou • Aguardando Gerência",
    atualizadoEm: "Hoje às 09:15",
  },
  {
    id: "req-2",
    tipo: "mural",
    meuPlantao: "15/Nov (07h às 19h)",
    status: "pending_peer",
    rotuloStatus: "Disponível no mural do setor",
    atualizadoEm: "Ontem às 14:00",
  },
];

export default function SwapsPage() {
  const [abaAtiva, setAbaAtiva] = useState<"mural" | "solicitacoes">("mural");
  const [mural, setMural] = useState<OfertaMural[]>(muralInicial);
  const [minhasSolicitacoes, setMinhasSolicitacoes] = useState<SolicitacaoUsuario[]>(minhasSolicitacoesIniciais);
  const [modalAberto, setModalAberto] = useState(false);

  // Estados do formulário
  const [tipoTroca, setTipoTroca] = useState<"direta" | "mural">("direta");
  const [meuPlantaoSelecionado, setMeuPlantaoSelecionado] = useState("10 de Novembro • 07h-19h (Diurno)");
  const [colegaAlvo, setColegaAlvo] = useState("Maria Costa");
  const [plantaoAlvo, setPlantaoAlvo] = useState("12 de Novembro • 07h-19h (Diurno)");
  const [motivo, setMotivo] = useState("");

  const criarProposta = (evento: React.FormEvent) => {
    evento.preventDefault();

    if (tipoTroca === "direta") {
      const novaSolicitacao: SolicitacaoUsuario = {
        id: `req-${Date.now()}`,
        tipo: "direta",
        meuPlantao: meuPlantaoSelecionado,
        plantaoAlvo: plantaoAlvo,
        nomeColega: colegaAlvo,
        status: "pending_peer",
        rotuloStatus: "Aguardando aceite do colega",
        atualizadoEm: "Agora",
      };
      setMinhasSolicitacoes([novaSolicitacao, ...minhasSolicitacoes]);
      setAbaAtiva("solicitacoes");
    } else {
      const novaOferta: OfertaMural = {
        id: `m-${Date.now()}`,
        nomeProfissional: "João Lima (Você)",
        cargo: "Enfermeiro Plantonista",
        coren: "210.450-ENF",
        setor: "UTI Adulto",
        dataPlantao: "10 de Novembro (Terça)",
        tipoTurno: "D",
        horarioPlantao: "07:00 às 19:00",
        observacoes: motivo || "Disponibilizado para troca",
        publicadoEm: "Agora",
      };
      setMural([novaOferta, ...mural]);
      setAbaAtiva("mural");
    }

    setModalAberto(false);
  };

  return (
    <>
      <PageHeader
        title="Minhas trocas"
        description="Mural de oportunidades do setor e o fluxo formal das suas propostas de troca."
        action={
          <Button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Propor nova troca
          </Button>
        }
      />

      {/* Abas */}
      <div className="mb-6 flex border-b border-line">
        <button
          type="button"
          onClick={() => setAbaAtiva("mural")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
            abaAtiva === "mural"
              ? "border-brand text-brand"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <ArrowLeftRight className="h-4 w-4" />
          Mural do Setor ({mural.length})
        </button>
        <button
          type="button"
          onClick={() => setAbaAtiva("solicitacoes")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
            abaAtiva === "solicitacoes"
              ? "border-brand text-brand"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <Send className="h-4 w-4" />
          Minhas Solicitações ({minhasSolicitacoes.length})
        </button>
      </div>

      {/* Conteúdo da Aba Mural */}
      {abaAtiva === "mural" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {mural.map((oferta) => (
            <Card key={oferta.id} className="border-line hover:border-brand/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand">
                      {oferta.setor}
                    </span>
                    <h3 className="text-base font-bold text-ink mt-0.5">{oferta.nomeProfissional}</h3>
                    <p className="text-xs text-ink-soft">{oferta.cargo} • {oferta.coren}</p>
                  </div>
                  <Badge variant={oferta.tipoTurno === "D" ? "info" : "neutral"}>
                    Turno {oferta.tipoTurno === "D" ? "Diurno" : "Noturno"}
                  </Badge>
                </div>

                <div className="mt-4 rounded-lg bg-surface p-3 border border-line">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink">
                    <Calendar className="h-4 w-4 text-brand" />
                    <span>{oferta.dataPlantao}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-soft mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{oferta.horarioPlantao}</span>
                  </div>
                </div>

                {oferta.observacoes && (
                  <p className="mt-3 text-xs text-ink italic bg-amber-50/50 p-2.5 rounded border border-amber-200/50">
                    "{oferta.observacoes}"
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-[11px] text-ink-soft">Postado: {oferta.publicadoEm}</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      setMeuPlantaoSelecionado("12 de Novembro • 07h-19h (Diurno)");
                      setColegaAlvo(oferta.nomeProfissional);
                      setPlantaoAlvo(`${oferta.dataPlantao} • ${oferta.horarioPlantao}`);
                      setModalAberto(true);
                    }}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Tenho interesse
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Conteúdo da Aba Minhas Solicitações */}
      {abaAtiva === "solicitacoes" && (
        <div className="space-y-4">
          {minhasSolicitacoes.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-brand">
                      {req.tipo === "direta" ? "Troca Direta" : "Mural Aberto"}
                    </span>
                    <span className="text-xs text-ink-soft">• #{req.id}</span>
                  </div>
                  <h4 className="font-bold text-ink text-base mt-1">
                    Seu plantão em <span className="text-brand-dark">{req.meuPlantao}</span>
                    {req.plantaoAlvo && (
                      <> por <span className="text-ok-dark">{req.plantaoAlvo}</span> ({req.nomeColega})</>
                    )}
                  </h4>
                  <p className="text-xs text-ink-soft mt-1">Atualizado em: {req.atualizadoEm}</p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      req.status === "approved"
                        ? "success"
                        : req.status === "awaiting_manager"
                        ? "warning"
                        : "info"
                    }
                  >
                    {req.rotuloStatus}
                  </Badge>

                  {req.status === "pending_peer" && (
                    <Button variant="outline" size="sm" className="text-xs text-danger-dark">
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal - Propor Nova Troca */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-2xl animate-in fade-in-50">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h2 className="text-lg font-bold text-ink">Propor Troca de Plantão</h2>
                <p className="text-xs text-ink-soft">
                  O colega receberá sua proposta para aceite antes da validação formal da gerência.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="rounded-md p-1.5 text-ink-soft hover:bg-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={criarProposta} className="mt-4 space-y-4">
              {/* Tipo de Troca */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                  Modalidade da Troca
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoTroca("direta")}
                    className={`rounded-lg border p-3 text-left text-xs font-bold transition-colors ${
                      tipoTroca === "direta"
                        ? "border-brand bg-brand-tint text-brand-dark"
                        : "border-line bg-white text-ink hover:bg-surface"
                    }`}
                  >
                    Troca Direta 1:1
                    <p className="font-normal text-[11px] text-ink-soft mt-0.5">Com um colega específico</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoTroca("mural")}
                    className={`rounded-lg border p-3 text-left text-xs font-bold transition-colors ${
                      tipoTroca === "mural"
                        ? "border-brand bg-brand-tint text-brand-dark"
                        : "border-line bg-white text-ink hover:bg-surface"
                    }`}
                  >
                    Publicar no Mural
                    <p className="font-normal text-[11px] text-ink-soft mt-0.5">Para quem tiver interesse</p>
                  </button>
                </div>
              </div>

              {/* Passo 1: Seu plantão */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                  1. Seu plantão a ser trocado
                </label>
                <select
                  value={meuPlantaoSelecionado}
                  onChange={(e) => setMeuPlantaoSelecionado(e.target.value)}
                  className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm font-medium text-ink focus:border-brand focus:outline-none"
                >
                  <option value="10 de Novembro • 07h-19h (Diurno)">10/Nov (Ter) • 07h às 19h (Diurno - UTI)</option>
                  <option value="14 de Novembro • 07h-19h (Diurno)">14/Nov (Sáb) • 07h às 19h (Diurno - UTI)</option>
                  <option value="19 de Novembro • 19h-07h (Noturno)">19/Nov (Qui) • 19h às 07h (Noturno - UTI)</option>
                </select>
              </div>

              {/* Passo 2: Colega e Plantão Alvo (se direto) */}
              {tipoTroca === "direta" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                      2. Colega pretendido
                    </label>
                    <select
                      value={colegaAlvo}
                      onChange={(e) => setColegaAlvo(e.target.value)}
                      className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm font-medium text-ink focus:border-brand focus:outline-none"
                    >
                      <option value="Maria Costa">Maria Costa (Enf. Plantonista)</option>
                      <option value="Carlos Alves">Carlos Alves (Téc. Enfermagem)</option>
                      <option value="Paula Reis">Paula Reis (Téc. Enfermagem)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                      3. Plantão pretendido do colega
                    </label>
                    <select
                      value={plantaoAlvo}
                      onChange={(e) => setPlantaoAlvo(e.target.value)}
                      className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm font-medium text-ink focus:border-brand focus:outline-none"
                    >
                      <option value="12 de Novembro • 07h-19h (Diurno)">12/Nov (Qui) • 07h às 19h</option>
                      <option value="16 de Novembro • 07h-19h (Diurno)">16/Nov (Seg) • 07h às 19h</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Observação / Motivo */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                  Motivo ou Observação (opcional)
                </label>
                <Input
                  placeholder="Ex: Consulta médica agendada / Compromisso pessoal"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </div>

              <div className="rounded-lg bg-surface p-3 text-xs text-ink-soft border border-line flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                <span>
                  O aceite do colega não altera a escala oficial. A mudança só ocorre após validação e aprovação da gerência.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalAberto(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Enviar proposta
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
