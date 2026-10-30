import { useState } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AprovacaoPendente = {
  id: string;
  setor: string;
  solicitante: {
    nome: string;
    cargo: string;
    coren: string;
    dataPlantao: string;
    horarioPlantao: string;
    tipoTurno: "D" | "N";
  };
  substituto: {
    nome: string;
    cargo: string;
    coren: string;
    dataPlantao: string;
    horarioPlantao: string;
    tipoTurno: "D" | "N";
  };
  verificacoes: {
    cobertura: boolean;
    semConflito: boolean;
    qualificacoes: boolean;
  };
  status: "awaiting" | "approved" | "rejected";
  motivoRejeicao?: string;
};

const aprovacoesIniciais: AprovacaoPendente[] = [
  {
    id: "app-1",
    setor: "UTI Adulto • Leitos 1 a 10",
    solicitante: {
      nome: "João Lima",
      cargo: "Enfermeiro Plantonista",
      coren: "210.450-ENF",
      dataPlantao: "10 de Novembro (Terça)",
      horarioPlantao: "07:00 às 19:00 (Diurno)",
      tipoTurno: "D",
    },
    substituto: {
      nome: "Maria Costa",
      cargo: "Enfermeira Plantonista",
      coren: "305.120-ENF",
      dataPlantao: "12 de Novembro (Quinta)",
      horarioPlantao: "07:00 às 19:00 (Diurno)",
      tipoTurno: "D",
    },
    verificacoes: {
      cobertura: true,
      semConflito: true,
      qualificacoes: true,
    },
    status: "awaiting",
  },
  {
    id: "app-2",
    setor: "Pronto Atendimento",
    solicitante: {
      nome: "Rafael Martins",
      cargo: "Técnico de Enfermagem",
      coren: "634.789-TE",
      dataPlantao: "18 de Novembro (Quarta)",
      horarioPlantao: "19:00 às 07:00 (Noturno)",
      tipoTurno: "N",
    },
    substituto: {
      nome: "Lucas Fernandes",
      cargo: "Técnico de Enfermagem",
      coren: "856.901-TE",
      dataPlantao: "20 de Novembro (Sexta)",
      horarioPlantao: "19:00 às 07:00 (Noturno)",
      tipoTurno: "N",
    },
    verificacoes: {
      cobertura: true,
      semConflito: false, // Exemplo de conflito
      qualificacoes: true,
    },
    status: "awaiting",
  },
];

export default function ApprovalsPage() {
  const [aprovacoes, setAprovacoes] = useState<AprovacaoPendente[]>(aprovacoesIniciais);
  const [idEmRecusa, setIdEmRecusa] = useState<string | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState("");

  const aprovarTroca = (id: string) => {
    setAprovacoes((anteriores) =>
      anteriores.map((item) => (item.id === id ? { ...item, status: "approved" } : item))
    );
  };

  const rejeitarTroca = (id: string) => {
    if (!motivoRecusa) return;
    setAprovacoes((anteriores) =>
      anteriores.map((item) =>
        item.id === id ? { ...item, status: "rejected", motivoRejeicao: motivoRecusa } : item
      )
    );
    setIdEmRecusa(null);
    setMotivoRecusa("");
  };

  const quantidadePendentes = aprovacoes.filter((a) => a.status === "awaiting").length;

  return (
    <>
      <PageHeader
        title="Fila de Aprovações"
        description="Trocas aceitas entre profissionais que aguardam validação gerencial e atualização atômica na escala oficial."
        action={
          <Badge variant={quantidadePendentes > 0 ? "warning" : "success"} className="px-3 py-1 text-sm">
            {quantidadePendentes} pendente(s)
          </Badge>
        }
      />

      <div className="space-y-6">
        {aprovacoes.map((item) => (
          <Card key={item.id} className="overflow-hidden border-line">
            <CardContent className="p-0">
              {/* Header do Card */}
              <div className="flex flex-wrap items-center justify-between border-b border-line bg-surface/60 px-6 py-3.5">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-brand" />
                  <span className="font-bold text-ink text-sm">Solicitação #{item.id}</span>
                  <span className="text-xs text-ink-soft">• {item.setor}</span>
                </div>

                <div>
                  {item.status === "awaiting" && (
                    <Badge variant="warning">Aguardando decisão da gerência</Badge>
                  )}
                  {item.status === "approved" && (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Escala oficial atualizada
                    </Badge>
                  )}
                  {item.status === "rejected" && (
                    <Badge variant="danger" className="gap-1">
                      <XCircle className="h-3.5 w-3.5" /> Rejeitada pela coordenação
                    </Badge>
                  )}
                </div>
              </div>

              {/* Corpo da Troca (2 lados) */}
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Solicitante */}
                  <div className="rounded-xl border border-line bg-surface/40 p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                      Profissional Proponente
                    </span>
                    <h4 className="mt-1 font-extrabold text-ink text-base">{item.solicitante.nome}</h4>
                    <p className="text-xs text-ink-soft">{item.solicitante.cargo} • {item.solicitante.coren}</p>

                    <div className="mt-4 rounded-lg bg-white p-3 border border-line">
                      <div className="text-xs font-semibold text-brand">Plantão a ceder:</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-ink-soft" />
                        <span className="font-bold text-ink text-sm">{item.solicitante.dataPlantao}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-ink-soft">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{item.solicitante.horarioPlantao}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contrapartida */}
                  <div className="rounded-xl border border-line bg-surface/40 p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                      Profissional Substituto (Aceitou a proposta)
                    </span>
                    <h4 className="mt-1 font-extrabold text-ink text-base">{item.substituto.nome}</h4>
                    <p className="text-xs text-ink-soft">{item.substituto.cargo} • {item.substituto.coren}</p>

                    <div className="mt-4 rounded-lg bg-white p-3 border border-line">
                      <div className="text-xs font-semibold text-brand">Plantão de contrapartida:</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-ink-soft" />
                        <span className="font-bold text-ink text-sm">{item.substituto.dataPlantao}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-ink-soft">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{item.substituto.horarioPlantao}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verificações do Sistema */}
                <div className="mt-6 rounded-xl border border-line bg-surface p-4">
                  <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
                    <ShieldCheck className="h-4 w-4 text-brand" />
                    Validações automáticas de regras institucionais
                  </h5>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-2 text-xs">
                      {item.verificacoes.cobertura ? (
                        <CheckCircle2 className="h-4 w-4 text-ok shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
                      )}
                      <span className={item.verificacoes.cobertura ? "text-ink font-medium" : "text-danger-dark font-bold"}>
                        Cobertura do setor preservada
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {item.verificacoes.semConflito ? (
                        <CheckCircle2 className="h-4 w-4 text-ok shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
                      )}
                      <span className={item.verificacoes.semConflito ? "text-ink font-medium" : "text-danger-dark font-bold"}>
                        {item.verificacoes.semConflito
                          ? "Sem conflito de horário (descanso > 11h)"
                          : "⚠️ Alerta: intervalo entre jornadas < 11h"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {item.verificacoes.qualificacoes ? (
                        <CheckCircle2 className="h-4 w-4 text-ok shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
                      )}
                      <span className="text-ink font-medium">Vínculos e cargos compatíveis</span>
                    </div>
                  </div>
                </div>

                {/* Ações da Gerência */}
                {item.status === "awaiting" && (
                  <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4">
                    {idEmRecusa === item.id ? (
                      <div className="flex flex-1 items-center gap-3">
                        <input
                          type="text"
                          placeholder="Justificativa da recusa obrigatória..."
                          value={motivoRecusa}
                          onChange={(e) => setMotivoRecusa(e.target.value)}
                          className="h-10 flex-1 rounded-md border border-line px-3 text-sm"
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => rejeitarTroca(item.id)}
                          disabled={!motivoRecusa}
                        >
                          Confirmar recusa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIdEmRecusa(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIdEmRecusa(item.id)}
                          className="text-danger-dark hover:bg-danger-tint hover:border-danger"
                        >
                          Rejeitar com justificativa
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => aprovarTroca(item.id)}
                          className="gap-2 shadow-sm"
                        >
                          <Sparkles className="h-4 w-4" />
                          Aprovar troca oficial
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {item.status === "approved" && (
                  <div className="mt-4 rounded-lg bg-ok-tint p-3 text-xs text-ok-dark font-semibold">
                    ✓ Troca aprovada pela gerência. Ambos os plantões foram atualizados no banco de dados e as notificações foram disparadas.
                  </div>
                )}

                {item.status === "rejected" && (
                  <div className="mt-4 rounded-lg bg-danger-tint p-3 text-xs text-danger-dark font-semibold">
                    ✕ Troca recusada pela gerência. Motivo: {item.motivoRejeicao}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
