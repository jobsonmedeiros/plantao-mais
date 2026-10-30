import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ModuleInfo } from "@/lib/modules";

export default function ModulePage({ module }: { module: ModuleInfo }) {
  const stageLabel = module.stage === "v2" ? "Versão 2" : `Etapa ${module.stage}`;
  const stageText =
    module.stage === "v2"
      ? "Esta tela está planejada para a Versão 2, depois do MVP."
      : `Esta tela é ligada ao backend na Etapa ${module.stage}. Por enquanto, ela mostra só a estrutura.`;

  return (
    <>
      <PageHeader
        title={module.title}
        description={module.description}
        action={<Badge variant="info">{stageLabel}</Badge>}
      />
      <Card>
        <CardContent className="grid gap-8 p-6 md:grid-cols-2">
          <EmptyState icon={module.icon} title="Esta tela ainda não está conectada" text={stageText} />
          <div>
            <h2 className="mb-3 text-base font-bold text-ink">O que você poderá fazer aqui</h2>
            <ul className="list-disc space-y-2 pl-5 text-[15px] text-ink">
              {module.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
