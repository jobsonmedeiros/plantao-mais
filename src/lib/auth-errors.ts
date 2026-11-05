export function traduzirErroAuth(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Não foi possível concluir a operação.";
  }

  const erro = error as { code?: string; message?: string };
  const mensagem = erro.message ?? "";

  if (erro.code === "email_not_confirmed" || mensagem === "Email not confirmed") {
    return "Confirme seu e-mail antes de entrar.";
  }
  if (mensagem === "Invalid login credentials") {
    return "E-mail ou senha incorretos.";
  }
  if (mensagem === "User already registered") {
    return "Este e-mail já possui cadastro. Entre com sua conta.";
  }
  if (erro.code === "weak_password" || mensagem.startsWith("Password should")) {
    return "A senha deve conter ao menos 10 caracteres, com letras maiúsculas, minúsculas e números.";
  }

  return mensagem || "Não foi possível concluir a operação.";
}
