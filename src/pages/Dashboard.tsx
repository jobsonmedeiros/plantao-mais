import {
  ArrowLeftRight,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { roleLabels, useRole } from "@/lib/role-context";

type Indicador = {
  titulo: string;
  descricao: string;
  Icone: LucideIcon;
};

const indicadoresGerenciais: Indicador[] = [
  {
    titulo: "Cobertura das escalas",
    descricao: "Cobertura por setor e turno",
    Icone: CalendarDays,
  },
  {
    titulo: "Plantões descobertos",
    descricao: "Lacunas que precisam de atenção",
    Icone: Building2,
  },
  {
    titulo: "Trocas em andamento",
    descricao: "Negociações aguardando resposta",
    Icone: ArrowLeftRight,
  },
  {
    titulo: "Aprovações pendentes",
    descricao: "Decisões aguardando a gerência",
    Icone: ClipboardCheck,
  },
];

export default function Dashboard() {
  const { perfil, vinculos, instituicaoAtivaId } = useAuth();
  const { role } = useRole();
  const vinculoAtivo = vinculos.find((vinculo) => vinculo.institutionId === instituicaoAtivaId);
  const nome = perfil?.nomeCompleto ?? "Usuário";
  const ehGerencia = role === "manager" || role === "institution_admin";
  const titulo = role === "professional"
    ? `Olá, ${nome}`
    : role === "manager"
      ? "Painel de gerência"
      : role === "platform_admin"
        ? "Administração da plataforma"
        : "Administração da instituição";
  const setoresVisiveis = vinculoAtivo?.setores.filter(
    (setor) => role !== "manager" || setor.eGerente,
  ) ?? [];

  return (
    <>
      <PageHeader
        title={titulo}
        description={
          vinculoAtivo
            ? `${vinculoAtivo.institutionName} · ${role ? roleLabels[role] : ""}`
            : `${perfil?.email ?? ""} · ${role ? roleLabels[role] : ""}`
        }
      />

      <section
        aria-labelledby="painel-status"
        className="mb-6 rounded-xl border border-brand/20 bg-brand-tint p-5 sm:p-6"
      >
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-lg bg-white p-3 text-brand-dark">
            <CalendarDays className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="painel-status" className="text-lg font-bold text-ink">
              {ehGerencia ? "Resumo operacional em integração" : "Visão geral em integração"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
              Este painel ainda não consulta escalas, cobertura ou solicitações no banco. Os indicadores abaixo
              aparecem como indisponíveis até que os módulos correspondentes estejam conectados; nenhum número
              demonstrativo é exibido.
            </p>
          </div>
        </div>
      </section>

      {ehGerencia && (
        <section aria-label="Indicadores operacionais" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {indicadoresGerenciais.map(({ titulo: tituloIndicador, descricao, Icone }) => (
            <Card key={tituloIndicador} className="min-w-0">
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-md bg-surface p-2 text-brand-dark">
                    <Icone className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink-soft">
                    Não conectado
                  </span>
                </div>
                <h2 className="mt-4 font-bold text-ink">{tituloIndicador}</h2>
                <p className="mt-1 text-sm leading-5 text-ink-soft">{descricao}</p>
                <p className="mt-4 border-t border-line pt-3 text-sm font-medium text-ink-soft">
                  Dados ainda indisponíveis
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand" aria-hidden="true" />
              {ehGerencia ? "Setores sob sua atuação" : "Seus setores"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!vinculoAtivo ? (
              <p className="text-sm leading-6 text-ink-soft">
                Não há uma instituição ativa associada a esta sessão.
              </p>
            ) : setoresVisiveis.length > 0 ? (
              <>
                <p className="mb-3 text-sm text-ink-soft">
                  {setoresVisiveis.length} {setoresVisiveis.length === 1 ? "setor vinculado" : "setores vinculados"}
                </p>
                <ul className="divide-y divide-line">
                  {setoresVisiveis.map((setor) => (
                    <li key={setor.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="font-semibold text-ink">{setor.nome}</p>
                      <p className="mt-1 text-sm text-ink-soft">
                        {[setor.cargo, setor.eGerente ? "Gerencia este setor" : null].filter(Boolean).join(" · ") || "Vínculo ativo"}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm leading-6 text-ink-soft">
                Nenhum setor ativo está associado a este vínculo.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>O que será acompanhado</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-6 text-ink">
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                Cobertura das escalas e plantões descobertos por setor e turno.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                Trocas em negociação e aprovações que aguardam decisão.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                Próximos plantões e alterações recentes na escala.
              </li>
            </ul>
            <p className="mt-5 border-t border-line pt-4 text-sm leading-6 text-ink-soft">
              Os itens são informativos: o painel não cria, altera nem aprova escalas ou trocas.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
