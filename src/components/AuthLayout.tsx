import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { ShiftChip, shiftKinds } from "@/components/ShiftChip";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isSupabaseConfigured } from "@/lib/supabase";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between bg-navy p-10 text-white md:flex">
        <Logo tone="light" />
        <div className="max-w-sm">
          <p className="text-3xl font-bold leading-tight">Escalas e trocas de plantão em um só lugar.</p>
          <p className="mt-4 text-base text-white/80">
            A gerência monta e publica a escala. Os profissionais combinam trocas entre si. A escala oficial só muda
            depois da aprovação.
          </p>
          <div className="mt-8 rounded-lg bg-white p-4 text-ink">
            <p className="mb-3 text-sm font-bold">Como a escala é lida</p>
            <ul className="grid grid-cols-2 gap-3">
              {shiftKinds.map((s) => (
                <li key={s.kind}>
                  <ShiftChip kind={s.kind} withLabel />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-sm text-white/70">Para hospitais, clínicas e UPAs.</p>
      </aside>

      <main className="relative flex items-center justify-center px-6 py-10">
        <ThemeToggle className="absolute right-4 top-4 md:right-6 md:top-6" />
        <div className="w-full max-w-sm">
          <Logo className="mb-8 md:hidden" />
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-1 mb-6 text-base text-ink-soft">{subtitle}</p>
          <div
            role="status"
            className="mb-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-950"
          >
            {isSupabaseConfigured
              ? "Autenticação conectada ao Supabase; os módulos operacionais continuam demonstrativos."
              : "Modo demonstração: estes formulários não autenticam nem enviam e-mails."}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
