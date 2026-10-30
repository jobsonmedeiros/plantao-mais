import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-ink md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-base text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}
