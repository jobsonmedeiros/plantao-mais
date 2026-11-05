import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, alternarTema } = useTheme();
  const temaClaroAtivo = theme === "light";
  const Icon = temaClaroAtivo ? Moon : Sun;
  const proximoTema = temaClaroAtivo ? "escuro" : "claro";

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={`Ativar modo ${proximoTema}`}
      aria-pressed={!temaClaroAtivo}
      title={`Ativar modo ${proximoTema}`}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line bg-white text-ink-soft transition-colors hover:bg-surface hover:text-ink",
        className,
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
