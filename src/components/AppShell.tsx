import { useState } from "react";
import { Bell, MoreHorizontal, X } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { navByRole, type NavItem } from "@/lib/nav";
import { roleLabels, useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";

function SideLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/app"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium text-white/80 hover:bg-white/10 hover:text-white",
          isActive && "bg-white/15 text-white",
        )
      }
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {item.label}
    </NavLink>
  );
}

function BottomNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pinned = items.filter((i) => i.pin);
  const primary = pinned.length > 0 ? pinned : items.slice(0, 4);
  const overflow = items.filter((i) => !primary.includes(i));

  const tab = (isActive: boolean) =>
    cn(
      "flex w-full flex-col items-center gap-1 px-1 py-2 text-xs font-semibold",
      isActive ? "text-brand" : "text-ink-soft",
    );

  return (
    <>
      {open && (
        <div
          id="mais-menu"
          className="fixed inset-x-3 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 rounded-lg border border-line bg-white p-2 shadow-lg md:hidden"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-bold text-ink">Mais opções</p>
            <button type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} className="rounded p-1">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <ul>
            {overflow.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-3 text-[15px] font-medium text-ink",
                        isActive && "bg-brand-tint text-brand-dark",
                      )
                    }
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="flex">
          {primary.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to} className="flex-1">
                <NavLink to={item.to} end={item.to === "/app"} onClick={() => setOpen(false)} className={({ isActive }) => tab(isActive)}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="max-w-full truncate">{item.short}</span>
                </NavLink>
              </li>
            );
          })}
          {overflow.length > 0 && (
            <li className="flex-1">
              <button
                type="button"
                aria-expanded={open}
                aria-controls="mais-menu"
                onClick={() => setOpen((v) => !v)}
                className={tab(open)}
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                <span>Mais</span>
              </button>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}

export function AppShell() {
  const { role } = useRole();
  const items = navByRole[role];

  return (
    <div className="min-h-screen md:flex">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:font-semibold"
      >
        Ir para o conteúdo
      </a>

      <aside className="hidden w-64 shrink-0 flex-col bg-navy px-3 py-6 md:sticky md:top-0 md:flex md:h-screen print:hidden">
        <Logo tone="light" className="mb-8 px-3" />
        <nav aria-label="Navegação principal" className="flex-1">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.to}>
                <SideLink item={item} />
              </li>
            ))}
          </ul>
        </nav>
        <p className="px-3 text-sm text-white/70">Perfil: {roleLabels[role]}</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col print:w-full print:block">
        <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3 md:justify-end md:px-8 print:hidden">
          <Logo className="md:hidden" />
          <Link
            to="/app/notificacoes"
            aria-label="Notificações"
            className="rounded-md p-2 text-ink-soft hover:bg-surface"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
          </Link>
        </header>

        <main id="conteudo" tabIndex={-1} className="flex-1 bg-surface px-4 py-6 pb-28 md:px-8 md:pb-10 print:bg-white print:p-0 print:m-0 print:overflow-visible">
          <Outlet />
        </main>
      </div>

      <div className="print:hidden">
        <BottomNav key={role} items={items} />
      </div>
    </div>
  );
}
