import { Building2, CalendarDays, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth-context";
import { roleLabels, useRole } from "@/lib/role-context";

export default function Dashboard() {
  const { perfil, vinculos, instituicaoAtivaId } = useAuth();
  const { role } = useRole();
  const vinculoAtivo = vinculos.find((vinculo) => vinculo.institutionId === instituicaoAtivaId);
  const nome = perfil?.nomeCompleto ?? "Usuário";
  const titulo = role === "professional"
    ? `Olá, ${nome}`
    : role === "manager"
      ? "Painel de gerência"
      : role === "platform_admin"
        ? "Administração da plataforma"
        : "Administração da instituição";

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
        aria-labelledby="painel-indisponivel"
        className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-brand-tint p-3 text-brand-dark">
            <CalendarDays className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h2 id="painel-indisponivel" className="text-lg font-bold text-ink">
              Resumo de escalas em implantação
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
              Sua autenticação e seu vínculo estão ativos. Este painel ainda não consulta plantões, cobertura ou
              solicitações; esses dados serão exibidos quando os módulos correspondentes forem integrados ao banco.
            </p>
          </div>
        </div>
      </section>

      {vinculoAtivo && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-5 w-5 text-brand" aria-hidden="true" />
                Vínculo institucional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-ink-soft">
              <p className="font-semibold text-ink">{vinculoAtivo.institutionName}</p>
              <p>Papel: {role ? roleLabels[role] : "Não definido"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-brand" aria-hidden="true" />
                Setores vinculados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vinculoAtivo.setores.length > 0 ? (
                <ul className="space-y-2">
                  {vinculoAtivo.setores.map((setor) => (
                    <li key={setor.id} className="rounded-md border border-line px-3 py-2 text-sm">
                      <span className="font-semibold text-ink">{setor.nome}</span>
                      {setor.cargo && <span className="text-ink-soft"> · {setor.cargo}</span>}
                      {setor.eGerente && <span className="text-ink-soft"> · Gerencia este setor</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-soft">Nenhum setor ativo está associado a este vínculo.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
