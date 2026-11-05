export const MIN_PASSWORD_LENGTH = 10;

export const PASSWORD_REQUIREMENTS =
  "Use pelo menos 10 caracteres, incluindo letras maiúsculas, minúsculas e números.";

export function validarSenha(senha: string): string | null {
  if (senha.length < MIN_PASSWORD_LENGTH) {
    return "A senha deve conter no mínimo 10 caracteres.";
  }
  if (!/[a-z]/.test(senha) || !/[A-Z]/.test(senha) || !/[0-9]/.test(senha)) {
    return PASSWORD_REQUIREMENTS;
  }
  return null;
}
