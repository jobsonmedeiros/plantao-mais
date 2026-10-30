import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 py-2">
      <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface text-ink-soft">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-bold text-ink">{title}</p>
        <p className="mt-1 max-w-md text-[15px] text-ink-soft">{text}</p>
      </div>
      {children}
    </div>
  );
}
