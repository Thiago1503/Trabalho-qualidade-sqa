/**
 *
 * BUGS CAPTURADOS:
 *  - isPasswordValid() usa `password.length <= 8`, rejeitando senhas com
 *    exatamente 8 caracteres. O requisito exige "mínimo 8 caracteres",
 *    ou seja, 8 caracteres devem ser aceitos.
 */

import { isPasswordValid, getPasswordValidationMessage } from "@/utils/password";
import { isEmailValid, getEmailValidationMessage } from "@/utils/email";

//  Testes Unitários — isPasswordValid / getPasswordValidationMessage

describe("isPasswordValid", () => {

  it("[SUCESSO] deve retornar true para senha forte com mais de 8 caracteres", () => {
    expect(isPasswordValid("Senha@1234")).toBe(true);
  });

  it("[SUCESSO] deve retornar false para senha sem letra maiúscula", () => {
    expect(isPasswordValid("senha@123")).toBe(false);
  });

  it("[SUCESSO] deve retornar false para senha sem letra minúscula", () => {
    expect(isPasswordValid("SENHA@123")).toBe(false);
  });

  it("[SUCESSO] deve retornar false para senha sem número", () => {
    expect(isPasswordValid("Senha@abc")).toBe(false);
  });

  it("[SUCESSO] deve retornar false para senha sem caractere especial", () => {
    expect(isPasswordValid("Senha1234")).toBe(false);
  });

  it("[SUCESSO] deve retornar false para senha vazia", () => {
    expect(isPasswordValid("")).toBe(false);
  });

  /**
   * BUG: isPasswordValid usa `password.length <= 8`, o que faz senhas com
   *      exatamente 8 caracteres serem rejeitadas.
   *
   * Este teste FALHA porque isPasswordValid("Senha@12") retorna FALSE,
   * mas deveria retornar TRUE.
   */
  it("[SUCESSO] deve aceitar senha válida com exatamente 8 caracteres", () => {
    // "Senha@12" tem exatamente 8 chars com maiúscula, minúscula, número e especial
   // A senha possui exatamente 8 caracteres e atende todos os requisitos.
    expect(isPasswordValid("Senha@12")).toBe(true);
    // ↑ FALHA: isPasswordValid retorna FALSE por causa do bug `<= 8`
  });
});

describe("getPasswordValidationMessage", () => {
  it("[SUCESSO] deve retornar mensagem de erro quando senha é vazia", () => {
    expect(getPasswordValidationMessage("")).toBe("Senha é obrigatória");
  });

  it("[SUCESSO] deve retornar string vazia para senha válida (>8 chars)", () => {
    expect(getPasswordValidationMessage("Senha@1234")).toBe("");
  });

  it("[SUCESSO] deve mencionar 'mínimo de 8 caracteres' quando a senha é curta", () => {
    const msg = getPasswordValidationMessage("ab");
    expect(msg).toContain("mínimo de 8 caracteres");
  });
});

//  Testes Unitários — isEmailValid / getEmailValidationMessage

describe("isEmailValid", () => {
  it("[SUCESSO] deve retornar true para e-mail válido", () => {
    expect(isEmailValid("usuario@email.com")).toBe(true);
  });

  it("[SUCESSO] deve retornar false para e-mail sem @", () => {
    expect(isEmailValid("emailsemarroba.com")).toBe(false);
  });

  it("[SUCESSO] deve retornar false para string vazia", () => {
    expect(isEmailValid("")).toBe(false);
  });

  it("[SUCESSO] deve retornar false para e-mail sem domínio após @", () => {
    expect(isEmailValid("usuario@")).toBe(false);
  });
});

describe("getEmailValidationMessage", () => {
  it("[SUCESSO] deve retornar mensagem de erro para e-mail vazio", () => {
    expect(getEmailValidationMessage("")).toBe("Email é obrigatório");
  });

  it("[SUCESSO] deve retornar 'Email inválido' para e-mail malformado", () => {
    expect(getEmailValidationMessage("invalido")).toBe("Email inválido");
  });

  it("[SUCESSO] deve retornar string vazia para e-mail válido", () => {
    expect(getEmailValidationMessage("ok@email.com")).toBe("");
  });
});
