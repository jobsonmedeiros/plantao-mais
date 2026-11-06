import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import App from "@/App";
import { ThemeProvider } from "@/lib/theme-context";

function renderDemo() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/demo"]}>
        <CurrentPath />
        <App />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

function CurrentPath() {
  const { pathname } = useLocation();
  return <output data-testid="current-path">{pathname}</output>;
}

describe("demonstração pública", () => {
  afterEach(() => cleanup());

  it("abre sem login, identifica dados fictícios e permite acessar trocas", async () => {
    const user = userEvent.setup();
    renderDemo();

    expect(await screen.findByRole("heading", { name: "Painel de gerência" })).toBeInTheDocument();
    expect(screen.getByText(/Ambiente de demonstração/)).toBeInTheDocument();

    await user.click(screen.getAllByRole("link", { name: "Trocas de plantões" })[0]);

    expect(await screen.findByRole("heading", { name: "Trocas de Plantão" })).toBeInTheDocument();
  });

  it("limita os perfis públicos e oculta acesso ao perfil conectado", async () => {
    const user = userEvent.setup();
    renderDemo();

    const seletor = await screen.findByRole("combobox", { name: "Perfil em demonstração" });
    expect(within(seletor).queryByRole("option", { name: "Administração da plataforma" })).not.toBeInTheDocument();

    await user.selectOptions(seletor, "professional");

    expect(await screen.findByText("Olá, Demonstração • Profissional")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Meu perfil" })).not.toBeInTheDocument();
  });
});
