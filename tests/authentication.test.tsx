import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/lib/theme-context";
import AcceptInvitation from "@/pages/AcceptInvitation";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { traduzirErroAuth } from "@/lib/auth-errors";
import { validarSenha } from "@/lib/password";

const mocks = vi.hoisted(() => ({
  entrar: vi.fn(),
  reenviarConfirmacao: vi.fn(),
  cadastrar: vi.fn(),
  sair: vi.fn(),
  recarregarContexto: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    usuario: null,
    sessao: null,
    perfil: null,
    vinculos: [],
    instituicaoAtivaId: null,
    papelAtivo: null,
    carregando: false,
    erroCarregamento: null,
    definirInstituicaoAtiva: vi.fn(),
    recarregarContexto: mocks.recarregarContexto,
    entrar: mocks.entrar,
    cadastrar: mocks.cadastrar,
    reenviarConfirmacao: mocks.reenviarConfirmacao,
    sair: mocks.sair,
    recuperarSenha: vi.fn(),
    atualizarSenha: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: { rpc: mocks.rpc },
}));

function renderRota(element: ReactNode, rota = "/login") {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[rota]}>
        <Routes>
          <Route path="/login" element={element} />
          <Route path="/cadastro" element={element} />
          <Route path="/convite/:token" element={element} />
          <Route path="/app" element={<p>Área autenticada</p>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("autenticação", () => {
  beforeEach(() => {
    mocks.entrar.mockReset();
    mocks.reenviarConfirmacao.mockReset().mockResolvedValue({});
    mocks.cadastrar.mockReset();
    mocks.sair.mockReset().mockResolvedValue({});
    mocks.recarregarContexto.mockReset().mockResolvedValue({});
    mocks.rpc.mockReset();
  });

  afterEach(() => cleanup());

  it("encaminha login válido para a rota solicitada", async () => {
    mocks.entrar.mockResolvedValue({});
    const user = userEvent.setup();
    renderRota(
      <>
        <Login />
      </>,
      "/login?redirect=%2Fapp",
    );

    await user.type(screen.getByLabelText("E-mail"), "profissional@teste.local");
    await user.type(screen.getByLabelText("Senha"), "senha-existente");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Área autenticada")).toBeInTheDocument();
    expect(mocks.entrar).toHaveBeenCalledWith("profissional@teste.local", "senha-existente");
  });

  it("oferece acesso público ao modo de demonstração", () => {
    renderRota(<Login />);

    expect(screen.getByRole("link", { name: "Ver demonstração pública" })).toHaveAttribute("href", "/demo");
  });

  it("oferece reenvio quando o e-mail ainda não foi confirmado", async () => {
    mocks.entrar.mockResolvedValue({
      erro: "Confirme seu e-mail antes de entrar.",
      precisaConfirmarEmail: true,
    });
    const user = userEvent.setup();
    renderRota(<Login />);

    await user.type(screen.getByLabelText("E-mail"), "profissional@teste.local");
    await user.type(screen.getByLabelText("Senha"), "senha-existente");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await user.click(await screen.findByRole("button", { name: "Reenviar confirmação de e-mail" }));

    expect(mocks.reenviarConfirmacao).toHaveBeenCalledWith("profissional@teste.local");
    expect(await screen.findByText(/enviaremos um novo link de confirmação/i)).toBeInTheDocument();
  });

  it("permite reenviar a confirmação após o cadastro público", async () => {
    mocks.cadastrar.mockResolvedValue({ confirmacaoPendente: true });
    const user = userEvent.setup();
    renderRota(<Register />, "/cadastro");

    await user.type(screen.getByLabelText("Nome completo"), "Profissional de Teste");
    await user.type(screen.getByLabelText("E-mail"), "profissional@teste.local");
    await user.type(screen.getByLabelText("Senha"), "Plantao1234");
    await user.type(screen.getByLabelText("Confirmar senha"), "Plantao1234");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    await user.click(await screen.findByRole("button", { name: "Reenviar confirmação de e-mail" }));

    expect(mocks.cadastrar).toHaveBeenCalledWith(
      "profissional@teste.local",
      "Plantao1234",
      "Profissional de Teste",
    );
    expect(mocks.reenviarConfirmacao).toHaveBeenCalledWith("profissional@teste.local");
  });

  it("cria a conta do convite sem ativar o vínculo antes da confirmação", async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        email: "convidado@teste.local",
        role: "professional",
        status: "pending",
        expired: false,
        institution: "Hospital de Teste",
        sector: "UTI",
      },
      error: null,
    });
    mocks.cadastrar.mockResolvedValue({ confirmacaoPendente: true });
    const user = userEvent.setup();
    renderRota(<AcceptInvitation />, "/convite/token-teste");

    await screen.findByRole("heading", { name: "Ativar seu vínculo" });
    await user.clear(screen.getByLabelText("Nome completo"));
    await user.type(screen.getByLabelText("Nome completo"), "Profissional Convidado");
    await user.type(screen.getByLabelText("Crie sua senha"), "Plantao1234");
    await user.type(screen.getByLabelText("Confirme sua senha"), "Plantao1234");
    await user.click(screen.getByRole("button", { name: "Criar conta e aceitar convite" }));

    expect(await screen.findByRole("heading", { name: "Confirme seu e-mail" })).toBeInTheDocument();
    expect(mocks.cadastrar).toHaveBeenCalledWith(
      "convidado@teste.local",
      "Plantao1234",
      "Profissional Convidado",
      `${window.location.origin}/convite/token-teste`,
    );
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Reenviar confirmação de e-mail" }));
    expect(mocks.reenviarConfirmacao).toHaveBeenCalledWith(
      "convidado@teste.local",
      `${window.location.origin}/convite/token-teste`,
    );
  });
});

describe("regras de senha e mensagens de autenticação", () => {
  it("exige 10 caracteres, maiúscula, minúscula e número", () => {
    expect(validarSenha("Curta1")).toBe("A senha deve conter no mínimo 10 caracteres.");
    expect(validarSenha("somente-minusculas1")).toContain("maiúsculas");
    expect(validarSenha("Plantao1234")).toBeNull();
  });

  it("traduz erros conhecidos do Supabase para português", () => {
    expect(traduzirErroAuth({ message: "Invalid login credentials" })).toBe("E-mail ou senha incorretos.");
    expect(traduzirErroAuth({ code: "email_not_confirmed" })).toBe("Confirme seu e-mail antes de entrar.");
  });
});
