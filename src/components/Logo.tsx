import { cn } from "@/lib/utils";

export function Logo({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg text-xl font-bold leading-none",
          tone === "light" ? "bg-white text-navy" : "bg-brand text-white",
        )}
      >
        +
      </span>
      <span className={cn("text-xl font-bold tracking-tight", tone === "light" ? "text-white" : "text-navy")}>
        Plantão+
      </span>
    </span>
  );
}
