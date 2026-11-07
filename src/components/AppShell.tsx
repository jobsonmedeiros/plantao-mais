import { lazy, Suspense, useState } from "react";
import { Bell, LogOut, MoreHorizontal, UserRound, X } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth-context";
import { navByRole, type NavItem } from "@/lib/nav";
import { roleLabels, useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";

const DemoAppRoleSelector = lazy(() =>
  import("@/lib/demo/auth-provider").then((modulo) => ({ default: modulo.DemoAppRoleSelector })),
);

function SideLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to.endsWith("/app")}
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

export function AppShell({ modoDemoPublico = false }: { modoDemoPublico?: boolean }) {
  const { role } = useRole();
  const {
    perfil,
    vinculos,
    instituicaoAtivaId,
    definirInstituicaoAtiva,
    sair,
  } = useAuth();
  const [erroSaida, setErroSaida] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!role) return null;

  const itemsBase = modoDemoPublico
    ? navByRole[role].filter((item) => item.to !== "/app/meu-perfil")
    : navByRole[role];
  const items = itemsBase.map((item) =>
    modoDemoPublico ? { ...item, to: `/demo${item.to}` } : item,
  );
  const caminho = (path: string) => modoDemoPublico ? `/demo${path}` : path;
  const exibirDemo = modoDemoPublico;

  async function handleSair() {
    const resultado = await sair();
    if (resultado.erro) {
      setErroSaida(resultado.erro);
      return;
    }
    navigate("/login", { replace: true });
  }

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
        <p className="px-3 text-sm text-white/70">{roleLabels[role]}</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col print:w-full print:block">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-4 py-3 md:px-8 print:hidden">
          <Logo className="md:hidden" />
          <div className="ml-auto flex min-w-0 items-center gap-3">
            {exibirDemo && (
              <Suspense fallback={null}>
                <DemoAppRoleSelector />
              </Suspense>
            )}
            {vinculos.length > 1 && instituicaoAtivaId && (
              <label className="flex min-w-0 items-center gap-2 text-sm text-ink-soft">
                <span className="hidden sm:inline">Instituição</span>
                <select
                  aria-label="Instituição ativa"
                  value={instituicaoAtivaId}
                  onChange={(event) => definirInstituicaoAtiva(event.target.value)}
                  className="max-w-[12rem] rounded-md border border-line bg-white px-2 py-2 text-sm font-semibold text-ink sm:max-w-[18rem]"
                >
                  {vinculos.map((vinculo) => (
                    <option key={vinculo.id} value={vinculo.institutionId}>
                      {vinculo.institutionName}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {perfil && !modoDemoPublico && (
              <Link
                to={caminho("/app/meu-perfil")}
                aria-label="Meu perfil"
                title={perfil.nomeCompleto}
                className="rounded-md p-2 text-ink-soft hover:bg-surface"
              >
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </Link>
            )}
            <ThemeToggle />
            <Link
              to={caminho("/app/notificacoes")}
              aria-label="Notificações"
              className="rounded-md p-2 text-ink-soft hover:bg-surface"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => modoDemoPublico ? navigate("/login", { replace: true }) : void handleSair()}
              aria-label={modoDemoPublico ? "Sair da demonstração" : "Sair da conta"}
              title={modoDemoPublico ? "Sair da demonstração" : "Sair da conta"}
              className="rounded-md p-2 text-ink-soft hover:bg-surface"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        {erroSaida && (
          <div role="alert" className="mx-4 mt-3 rounded-md bg-danger-tint p-3 text-sm text-danger-dark md:mx-8">
            {erroSaida}
          </div>
        )}
        <main id="conteudo" tabIndex={-1} className="flex-1 bg-surface px-4 py-6 pb-28 md:px-8 md:pb-10 print:bg-white print:p-0 print:m-0 print:overflow-visible">
          {exibirDemo && (
            <div
              role="status"
              className="mb-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-950"
            >
              <strong>Ambiente de demonstração.</strong>{" "}
              Os dados são fictícios. As ações não são persistidas nem alteram uma escala oficial.
            </div>
          )}
          <Suspense
            fallback={
              <div className="py-12 text-center text-sm font-semibold text-ink-soft" role="status" aria-live="polite">
                Carregando página...
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      <div className="print:hidden">
        <BottomNav key={role} items={items} />
      </div>
    </div>
  );
}
