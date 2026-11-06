import type { ReactNode } from "react";

/**
 * Cabeçalho de página.
 *
 * O bloco de ação NUNCA empilha em telas pequenas a ponto de colidir com o
 * título: em mobile ele desce para baixo do texto e ocupa a largura toda, e a
 * partir de `sm` fica alinhado à direita na mesma linha. `shrink-0` impede que
 * o título "esprema" os botões e `min-w-0` impede que um texto longo empurre a
 * ação para fora do container.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string;
  description?: string;
  /** Linha curta acima do título (instituição • setor, por exemplo). */
  eyebrow?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1">
        {eyebrow && <div className="mb-1">{eyebrow}</div>}
        <h1 className="text-2xl font-bold leading-tight text-ink md:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-base text-ink-soft">{description}</p>}
      </div>
      {action && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end sm:pt-1">
          {action}
        </div>
      )}
    </div>
  );
}
