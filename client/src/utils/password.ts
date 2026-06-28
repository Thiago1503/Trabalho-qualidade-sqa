export function isPasswordValid(password: string): boolean {
  if (!password || password.length <= 8) {
    return false;
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[@#$%^&*()_+\-=\[\]{};':"\\|,<>\/?]/.test(password);

  return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
}

export function getPasswordValidationMessage(password: string): string {
  if (!password) {
    return "Senha é obrigatória";
  }

  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("mínimo de 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("uma letra maiúscula");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("uma letra minúscula");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("um número");
  }

  if (!/[@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("um caractere especial");
  }

  if (errors.length === 0) {
    return "";
  }

  return `A senha deve conter: ${errors.join(", ")}`;
}

