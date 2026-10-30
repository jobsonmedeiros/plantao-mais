import { useState } from "react";
import {
  CheckCircle2,
  Download,
  AlertCircle,
  Sparkles,
  Printer,
  X,
  FileText,
  Calendar,
} from "lucide-react";
import { ShiftChip, shiftKinds, type ShiftKind } from "@/components/ShiftChip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const totalDiasNoMes = 30; // Novembro
const dias = Array.from({ length: totalDiasNoMes }, (_, indice) => {
  const diaNumero = indice + 1;
  const nomesDiasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  // 01/Nov/2026 é Domingo (índice 0)
  const diaDaSemana = (diaNumero - 1) % 7;
  return {
    dia: diaNumero,
    rotulo: String(diaNumero).padStart(2, "0"),
    diaSemanaTexto: nomesDiasSemana[diaDaSemana],
    eFimDeSemana: diaDaSemana === 0 || diaDaSemana === 6,
  };
});

const quinzena1 = dias.slice(0, 15); // Dias 01 a 15
const quinzena2 = dias.slice(15, 30); // Dias 16 a 30

type EscalaProfissional = {
  id: string;
  nome: string;
  cargo: string;
  coren: string;
  turnos: Record<number, ShiftKind>;
};

// Dados da equipe da UTI Adulto
const equipeInicial: EscalaProfissional[] = [
  {
    id: "1",
    nome: "Ana Souza",
    cargo: "Enfermeira Chefe",
    coren: "142.890",
    turnos: {
      1: "D", 2: "D", 3: "F", 4: "N", 5: "N", 6: "F", 7: "D",
      8: "D", 9: "F", 10: "N", 11: "N", 12: "F", 13: "D", 14: "D",
      15: "F", 16: "N", 17: "N", 18: "F", 19: "D", 20: "D", 21: "F",
      22: "N", 23: "N", 24: "F", 25: "D", 26: "D", 27: "F", 28: "N", 29: "N", 30: "F"
    },
  },
  {
    id: "2",
    nome: "João Lima",
    cargo: "Enfermeiro Plantonista",
    coren: "210.450",
    turnos: {
      1: "N", 2: "F", 3: "D", 4: "D", 5: "F", 6: "N", 7: "N",
      8: "F", 9: "D", 10: "D", 11: "F", 12: "N", 13: "N", 14: "F",
      15: "D", 16: "D", 17: "F", 18: "N", 19: "N", 20: "F", 21: "D",
      22: "D", 23: "F", 24: "N", 25: "N", 26: "F", 27: "D", 28: "D", 29: "F", 30: "N"
    },
  },
  {
    id: "3",
    nome: "Maria Costa",
    cargo: "Enfermeira Plantonista",
    coren: "305.120",
    turnos: {
      1: "F", 2: "D", 3: "D", 4: "F", 5: "D", 6: "D", 7: "F",
      8: "N", 9: "N", 10: "F", 11: "D", 12: "D", 13: "F", 14: "D",
      15: "D", 16: "F", 17: "D", 18: "D", 19: "F", 20: "N", 21: "N",
      22: "F", 23: "D", 24: "D", 25: "F", 26: "D", 27: "D", 28: "F", 29: "N", 30: "N"
    },
  },
  {
    id: "4",
    nome: "Carlos Alves",
    cargo: "Técnico de Enfermagem",
    coren: "412.980",
    turnos: {
      1: "D", 2: "N", 3: "N", 4: "F", 5: "D", 6: "F", 7: "D",
      8: "D", 9: "N", 10: "N", 11: "F", 12: "D", 13: "F", 14: "D",
      15: "D", 16: "N", 17: "N", 18: "F", 19: "D", 20: "F", 21: "D",
      22: "D", 23: "N", 24: "N", 25: "F", 26: "D", 27: "F", 28: "D", 29: "D", 30: "N"
    },
  },
  {
    id: "5",
    nome: "Paula Reis",
    cargo: "Técnica de Enfermagem",
    coren: "523.411",
    turnos: {
      1: "F", 2: "F", 3: "D", 4: "D", 5: "N", 6: "N", 7: "F",
      8: "F", 9: "F", 10: "D", 11: "D", 12: "N", 13: "N", 14: "F",
      15: "F", 16: "F", 17: "D", 18: "D", 19: "N", 20: "N", 21: "F",
      22: "F", 23: "F", 24: "D", 25: "D", 26: "N", 27: "N", 28: "F",
      29: "F", 30: "D"
    },
  },
  {
    id: "6",
    nome: "Roberto Miranda",
    cargo: "Técnico de Enfermagem",
    coren: "634.119",
    turnos: {
      1: "D", 2: "D", 3: "F", 4: "FE", 5: "FE", 6: "FE", 7: "FE",
      8: "FE", 9: "FE", 10: "FE", 11: "FE", 12: "FE", 13: "FE", 14: "FE",
      15: "FE", 16: "FE", 17: "FE", 18: "FE", 19: "F", 20: "D", 21: "D",
      22: "F", 23: "N", 24: "N", 25: "F", 26: "D", 27: "D", 28: "F", 29: "N", 30: "N"
    },
  },
];

export default function SchedulesPage() {
  const [equipe, setEquipe] = useState<EscalaProfissional[]>(equipeInicial);
  const [escalaPublicada, setEscalaPublicada] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);
  const [abaVisualizacao, setAbaVisualizacao] = useState<"quinzena1" | "quinzena2" | "completo">("quinzena1");
  const [modalImpressaoAberto, setModalImpressaoAberto] = useState(false);

  // Alterna o turno na célula: D -> N -> F -> FE -> D
  const alternarTurno = (idProfissional: string, dia: number) => {
    if (escalaPublicada) return;
    setEquipe((equipeAnterior) =>
      equipeAnterior.map((membro) => {
        if (membro.id !== idProfissional) return membro;
        const turnoAtual = membro.turnos[dia] || "F";
        const ordemTurnos: ShiftKind[] = ["D", "N", "F", "FE"];
        const proximoTurno = ordemTurnos[(ordemTurnos.indexOf(turnoAtual) + 1) % ordemTurnos.length];
        return {
          ...membro,
          turnos: { ...membro.turnos, [dia]: proximoTurno },
        };
      })
    );
  };

  // Cálculo de cobertura diurna e noturna
  const obterCoberturaDoDia = (dia: number) => {
    let totalDiurno = 0;
    let totalNoturno = 0;
    equipe.forEach((profissional) => {
      if (profissional.turnos[dia] === "D") totalDiurno++;
      if (profissional.turnos[dia] === "N") totalNoturno++;
    });
    return { totalDiurno, totalNoturno };
  };

  const dispararImpressao = () => {
    setModalImpressaoAberto(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Renderizador de tabela de quinzena com tipografia e espaçamento legíveis
  const renderTabelaQuinzena = (listaDias: typeof dias, rotuloQuinzena: string, modoImpressao = false) => (
    <div className={`overflow-x-auto rounded-lg border border-line bg-white shadow-sm ${modoImpressao ? "shadow-none border-line/80 overflow-visible" : ""}`}>
      {modoImpressao && (
        <div className="border-b border-line bg-surface/80 px-4 py-2 flex items-center justify-between">
          <div className="font-extrabold text-ink text-sm">
            {rotuloQuinzena} • Novembro 2026
          </div>
          <div className="text-xs text-ink-soft">
            Hospital Santa Maria • UTI Adulto
          </div>
        </div>
      )}

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-surface">
            <th scope="col" className="sticky left-0 z-20 w-60 bg-surface px-4 py-3 text-left font-bold text-ink">
              Profissional
            </th>
            {listaDias.map((d) => (
              <th
                key={d.dia}
                scope="col"
                onClick={() => setDiaSelecionado(diaSelecionado === d.dia ? null : d.dia)}
                className={`cursor-pointer px-2 py-2 text-center transition-colors hover:bg-brand-tint/60 ${
                  d.eFimDeSemana ? "bg-amber-50/70" : ""
                } ${diaSelecionado === d.dia ? "bg-brand-tint ring-2 ring-brand ring-inset" : ""}`}
              >
                <div className="text-xs uppercase font-bold text-ink-soft">{d.diaSemanaTexto}</div>
                <div className="text-sm font-extrabold text-ink mt-0.5">{d.rotulo}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {equipe.map((profissional) => (
            <tr key={profissional.id} className="hover:bg-surface/50 transition-colors">
              <td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium text-ink shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                <div className="font-bold text-ink text-sm leading-tight">{profissional.nome}</div>
                <div className="text-xs text-ink-soft mt-0.5">{profissional.cargo}</div>
              </td>

              {listaDias.map((d) => {
                const turno = profissional.turnos[d.dia] || "F";
                return (
                  <td
                    key={d.dia}
                    onClick={() => alternarTurno(profissional.id, d.dia)}
                    title={`${profissional.nome} - Dia ${d.rotulo} (${turno}) - Clique para alternar`}
                    className={`px-1 py-2 text-center cursor-pointer select-none transition-transform hover:scale-110 ${
                      d.eFimDeSemana ? "bg-amber-50/30" : ""
                    }`}
                  >
                    <ShiftChip kind={turno} size="md" />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>

        {/* Linha de Cobertura Diária */}
        <tfoot>
          <tr className="border-t-2 border-line bg-surface/90 text-xs font-bold text-ink">
            <td className="sticky left-0 bg-surface px-4 py-3 font-bold">
              Cobertura (D / N)
            </td>
            {listaDias.map((d) => {
              const { totalDiurno, totalNoturno } = obterCoberturaDoDia(d.dia);
              const coberturaAbaixo = totalDiurno < 2 || totalNoturno < 2;
              return (
                <td
                  key={d.dia}
                  className={`px-1 py-2.5 text-center font-bold text-sm ${
                    coberturaAbaixo ? "bg-red-50 text-danger-dark font-extrabold" : "text-ink"
                  }`}
                >
                  <span className={totalDiurno < 2 ? "text-danger-dark font-extrabold" : "text-amber-600"}>{totalDiurno}</span>
                  <span className="mx-0.5 text-ink-soft">/</span>
                  <span className={totalNoturno < 2 ? "text-danger-dark font-extrabold" : "text-indigo-900"}>{totalNoturno}</span>
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );

  return (
    <>
      {/* ────────────────── VISTA EM TELA (WEB) ────────────────── */}
      <div className="print:hidden">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand">
              <span>Hospital Santa Maria</span>
              <span>•</span>
              <span>UTI Geral</span>
            </div>
            <h1 className="text-2xl font-extrabold text-ink">Escala Mensal • Novembro 2026</h1>
            <p className="text-sm text-ink-soft">
              Visualização espaçada em quinzenas para leitura confortável. Clique em qualquer célula para alternar o turno.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalImpressaoAberto(true)}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <Download className="h-4 w-4" />
              Exportar PDF (2 Páginas)
            </Button>

            {escalaPublicada ? (
              <Badge variant="success" className="px-3 py-1.5 text-sm gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Escala Oficial Publicada
              </Badge>
            ) : (
              <Button
                size="sm"
                onClick={() => setEscalaPublicada(true)}
                className="flex items-center gap-2 bg-brand text-white shadow-sm"
              >
                <Sparkles className="h-4 w-4" />
                Publicar escala oficial
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="space-y-5 p-5">
            {/* Seletor de Período (Abas) e Legenda */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              {/* Abas de Quinzena */}
              <div className="flex rounded-lg border border-line bg-surface p-1">
                <button
                  type="button"
                  onClick={() => setAbaVisualizacao("quinzena1")}
                  className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    abaVisualizacao === "quinzena1"
                      ? "bg-white text-brand shadow-sm"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  1ª Quinzena (Dias 01 a 15)
                </button>
                <button
                  type="button"
                  onClick={() => setAbaVisualizacao("quinzena2")}
                  className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    abaVisualizacao === "quinzena2"
                      ? "bg-white text-brand shadow-sm"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  2ª Quinzena (Dias 16 a 30)
                </button>
                <button
                  type="button"
                  onClick={() => setAbaVisualizacao("completo")}
                  className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    abaVisualizacao === "completo"
                      ? "bg-white text-brand shadow-sm"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Mês Completo (01 a 30)
                </button>
              </div>

              {/* Legenda dos Turnos com Alto Contraste */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">Legenda:</span>
                <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Legenda dos turnos">
                  {shiftKinds.map((s) => (
                    <li key={s.kind}>
                      <ShiftChip kind={s.kind} withLabel size="sm" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tabela Ativa na Tela */}
            {abaVisualizacao === "quinzena1" && renderTabelaQuinzena(quinzena1, "1ª Quinzena (Dias 01 a 15)")}
            {abaVisualizacao === "quinzena2" && renderTabelaQuinzena(quinzena2, "2ª Quinzena (Dias 16 a 30)")}
            {abaVisualizacao === "completo" && renderTabelaQuinzena(dias, "Mês Completo (Novembro 2026)")}

            {/* Dica de Uso */}
            <div className="flex items-center justify-between rounded-lg bg-surface p-3.5 text-xs text-ink-soft border border-line">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-brand shrink-0" />
                Dica: Clique sobre o botão do turno para alternar rapidamente entre Diurno (Âmbar), Noturno (Azul Noite), Folga e Férias.
              </span>
              <span className="font-semibold text-ink">
                Mínimo do setor: 2 Diurnos e 2 Noturnos por dia.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ────────────────── VISTA EXCLUSIVA DE IMPRESSÃO (2 PÁGINAS) ────────────────── */}
      <div className="hidden print:block">
        {/* PÁGINA 1: DIAS 01 A 15 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-ink">Hospital Santa Maria • UTI Adulto</div>
              <h2 className="text-xl font-extrabold text-ink">Escala Mensal • Novembro 2026 — 1ª Quinzena (Dias 01 a 15)</h2>
            </div>
            <div className="text-right">
              <span className="inline-block rounded border border-line bg-surface px-2.5 py-1 text-xs font-bold text-ink">
                Página 1 de 2
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pb-1">
            <ul className="flex items-center gap-4">
              {shiftKinds.map((s) => (
                <li key={s.kind}>
                  <ShiftChip kind={s.kind} withLabel size="sm" />
                </li>
              ))}
            </ul>
            <div className="text-ink-soft font-medium">Meta mínima: 2 Diurnos e 2 Noturnos</div>
          </div>

          {renderTabelaQuinzena(quinzena1, "1ª Quinzena", true)}
        </div>

        {/* QUEBRA DE PÁGINA OBRIGATÓRIA */}
        <div className="print-page-break" />

        {/* PÁGINA 2: DIAS 16 A 30 */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-ink">Hospital Santa Maria • UTI Adulto</div>
              <h2 className="text-xl font-extrabold text-ink">Escala Mensal • Novembro 2026 — 2ª Quinzena (Dias 16 a 30)</h2>
            </div>
            <div className="text-right">
              <span className="inline-block rounded border border-line bg-surface px-2.5 py-1 text-xs font-bold text-ink">
                Página 2 de 2
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pb-1">
            <ul className="flex items-center gap-4">
              {shiftKinds.map((s) => (
                <li key={s.kind}>
                  <ShiftChip kind={s.kind} withLabel size="sm" />
                </li>
              ))}
            </ul>
            <div className="text-ink-soft font-medium">Meta mínima: 2 Diurnos e 2 Noturnos</div>
          </div>

          {renderTabelaQuinzena(quinzena2, "2ª Quinzena", true)}
        </div>
      </div>

      {/* Modal de Instruções de Impressão e PDF */}
      {modalImpressaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-line bg-white p-6 shadow-2xl animate-in fade-in-50">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand" />
                <h3 className="text-lg font-bold text-ink">Exportar Escala em 2 Páginas</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalImpressaoAberto(false)}
                className="rounded-md p-1.5 text-ink-soft hover:bg-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm text-ink">
              <p className="text-xs text-ink-soft">
                A escala foi dividida estrategicamente para garantir leitura nítida e confortável:
              </p>

              <div className="rounded-lg bg-surface p-4 border border-line space-y-2 text-xs">
                <div className="font-semibold text-ink flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-white font-bold text-[11px]">1</span>
                  <span><strong>Folha 1</strong>: Dias 01 a 15 (1ª Quinzena)</span>
                </div>
                <div className="font-semibold text-ink flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-white font-bold text-[11px]">2</span>
                  <span><strong>Folha 2</strong>: Dias 16 a 30 (2ª Quinzena)</span>
                </div>
                <div className="pt-2 text-[11px] text-ink-soft border-t border-line/60">
                  💡 No diálogo de impressão, escolha <strong>Layout: Paisagem (Landscape)</strong> e marque <strong>"Gráficos de segundo plano"</strong> para preservar as novas cores distintas de Diurno e Noturno.
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalImpressaoAberto(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={dispararImpressao}
                className="gap-2 shadow-sm"
              >
                <Printer className="h-4 w-4" />
                Imprimir agora (2 folhas)
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
