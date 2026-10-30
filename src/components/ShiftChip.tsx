import { cn } from "@/lib/utils";

export type ShiftKind = "D" | "N" | "F" | "FE";

// Cores de alto contraste visual para enfermagem:
// D (Diurno): Âmbar Solar (brilhante, dia/sol)
// N (Noturno): Azul Noite Profundo / Índigo (escuro, noite/lua)
// F (Folga): Verde Esmeralda
// FE (Férias): Lilás / Roxo suave
export const shiftKinds: { kind: ShiftKind; code: string; label: string; className: string }[] = [
  {
    kind: "D",
    code: "D",
    label: "Diurno (07h-19h)",
    className: "bg-amber-500 text-white font-extrabold border border-amber-600 shadow-sm",
  },
  {
    kind: "N",
    code: "N",
    label: "Noturno (19h-07h)",
    className: "bg-indigo-950 text-white font-extrabold border border-indigo-900 shadow-sm",
  },
  {
    kind: "F",
    code: "F",
    label: "Folga",
    className: "border-2 border-ok bg-ok-tint text-ok-dark font-extrabold",
  },
  {
    kind: "FE",
    code: "Fé",
    label: "Férias",
    className: "border-2 border-purple-400 bg-purple-100 text-purple-900 font-extrabold",
  },
];

export function ShiftChip({
  kind,
  withLabel = false,
  size = "md",
}: {
  kind: ShiftKind;
  withLabel?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const info = shiftKinds.find((s) => s.kind === kind)!;

  const sizeClasses = {
    sm: "h-6 min-w-6 text-xs px-1",
    md: "h-8 min-w-8 text-sm px-2",
    lg: "h-9 min-w-9 text-base px-2.5",
  }[size];

  return (
    <span className="inline-flex items-center gap-2">
      <span
        role="img"
        aria-label={info.label}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-bold transition-transform",
          sizeClasses,
          info.className,
        )}
      >
        {info.code}
      </span>
      {withLabel && <span className="text-sm font-semibold text-ink">{info.label}</span>}
    </span>
  );
}
