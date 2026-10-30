import { cn } from "@/lib/utils";

export type Tone = "info" | "success" | "warning" | "danger";

const toneBar: Record<Tone, string> = {
  info: "border-l-brand",
  success: "border-l-ok",
  warning: "border-l-warn",
  danger: "border-l-danger",
};

const toneText: Record<Tone, string> = {
  info: "text-brand-dark",
  success: "text-ok-dark",
  warning: "text-warn-dark",
  danger: "text-danger-dark",
};

// Etapa 1: sem backend, o valor é sempre "—". Quando houver dados, passe `value`.
export function StatCard({ label, value, tone = "info" }: { label: string; value?: string | number; tone?: Tone }) {
  const empty = value === undefined;
  return (
    <div className={cn("rounded-lg border border-l-4 border-line bg-white p-4", toneBar[tone])}>
      <p className="text-sm font-semibold text-ink-soft">{label}</p>
      <p className={cn("mt-1 text-3xl font-bold", toneText[tone])}>
        {empty ? (
          <>
            <span aria-hidden="true">—</span>
            <span className="sr-only">sem dados ainda</span>
          </>
        ) : (
          value
        )}
      </p>
    </div>
  );
}
