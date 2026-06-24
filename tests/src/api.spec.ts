import { test, expect } from "@playwright/test";

/**
 * TESTES DE API — Caixa Preta
 *
 * Testam os endpoints da API diretamente via HTTP, sem passar pelo frontend.
 * São chamados "caixa preta" porque testamos apenas o comportamento externo
 * (entrada e saída) sem conhecer a implementação interna.
 *
 * Pré-requisito: Backend rodando em http://localhost:8080
 *
 * Endpoints testados:
 *   POST /auth/signup
 *   POST /auth/signin
 *   POST /auth/reset-password
 *   GET  /posts
 */

const API_URL = "http://localhost:8080";

// E-mail único por execução
const EMAIL_API = `api_teste_${Date.now()}@email.com`;
const SENHA_VALIDA = "Senha@1234";

// ══════════════════════════════════════════════
//  TESTES DE API — POST /auth/signup
// ══════════════════════════════════════════════

test.describe("API — POST /auth/signup", () => {

  test("[SUCESSO] deve cadastrar novo usuario e retornar HTTP 200 com dados do usuario", async ({ request }) => {
    // Faz a requisição POST para signup com dados válidos
    const response = await request.post(`${API_URL}/auth/signup`, {
      data: {
        email: EMAIL_API,
        password: SENHA_VALIDA,
      },
    });

    // Verifica que retornou HTTP 200
    expect(response.status()).toBe(200);

    // Verifica o corpo da resposta
    const body = await response.json();
    expect(body.email).toBe(EMAIL_API);
    expect(body.id).toBeTruthy(); // id foi gerado
  });

  test("[SUCESSO] deve retornar HTTP 422 para e-mail invalido", async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/signup`, {
      data: {
        email: "emailsemarroba",
        password: SENHA_VALIDA,
      },
    });

    // Verifica que retornou HTTP 422 (Unprocessable Entity)
    expect(response.status()).toBe(422);

    const body = await response.json();
    expect(body.message).toBe("E-mail inválido");
  });

  test("[SUCESSO] deve retornar HTTP 422 para senha fraca (sem maiuscula)", async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/signup`, {
      data: {
        email: "novo@email.com",
        password: "senha@123", // sem maiúscula
      },
    });

    expect(response.status()).toBe(422);

    const body = await response.json();
    expect(body.message).toBe("Senha inválida");
  });

  /**
   * BUG CAPTURADO:
   * Ao tentar cadastrar um e-mail duplicado, a API retorna a mensagem
   * "E-mail já está em uso", mas o requisito exige "E-mail já cadastrado".
   * Este teste FALHA intencionalmente para comprovar o bug.
   */
  test("[BUG] deve retornar mensagem 'E-mail ja cadastrado' para e-mail duplicado", async ({ request }) => {
    // Primeiro cadastro
    await request.post(`${API_URL}/auth/signup`, {
      data: { email: EMAIL_API, password: SENHA_VALIDA },
    });

    // Segunda tentativa com o mesmo e-mail
    const response = await request.post(`${API_URL}/auth/signup`, {
      data: { email: EMAIL_API, password: SENHA_VALIDA },
    });

    expect(response.status()).toBe(409);

    const body = await response.json();
    // BUG: a API retorna "E-mail já está em uso" em vez de "E-mail já cadastrado"
    expect(body.message).toBe("E-mail já cadastrado");
    // ↑ FALHA: retorna "E-mail já está em uso"
  });
});

// ══════════════════════════════════════════════
//  TESTES DE API — POST /auth/signin
// ══════════════════════════════════════════════

test.describe("API — POST /auth/signin", () => {

  test.beforeAll(async ({ request }) => {
    // Garante que o usuario de teste existe antes dos testes de login
    await request.post(`${API_URL}/auth/signup`, {
      data: { email: EMAIL_API, password: SENHA_VALIDA },
    });
  });

  test("[SUCESSO] deve autenticar usuario com credenciais corretas e retornar HTTP 200", async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/signin`, {
      data: {
        email: EMAIL_API,
        password: SENHA_VALIDA,
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.email).toBe(EMAIL_API);
    expect(body.id).toBeTruthy();
  });

  test("[SUCESSO] deve retornar HTTP 401 e mensagem 'Credenciais invalidas' para senha errada", async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/signin`, {
      data: {
        email: EMAIL_API,
        password: "SenhaErrada@999",
      },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.message).toBe("Credenciais inválidas");
  });

  test("[SUCESSO] deve retornar HTTP 401 para e-mail nao cadastrado", async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/signin`, {
      data: {
        email: "naocadastrado@email.com",
        password: SENHA_VALIDA,
      },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.message).toBe("Credenciais inválidas");
  });
});

// ══════════════════════════════════════════════
//  TESTES DE API — POST /auth/reset-password
// ══════════════════════════════════════════════

test.describe("API — POST /auth/reset-password", () => {

  test("[SUCESSO] deve retornar HTTP 404 e 'Usuario nao encontrado' para e-mail nao cadastrado", async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/reset-password`, {
      data: { email: "inexistente@email.com" },
    });

    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.message).toBe("Usuário não encontrado");
  });

  test("[SUCESSO] deve retornar HTTP 200 para e-mail cadastrado", async ({ request }) => {
    // Garante que o usuário existe
    await request.post(`${API_URL}/auth/signup`, {
      data: { email: EMAIL_API, password: SENHA_VALIDA },
    });

    const response = await request.post(`${API_URL}/auth/reset-password`, {
      data: { email: EMAIL_API },
    });

    expect(response.status()).toBe(200);
  });
});

// ══════════════════════════════════════════════
//  TESTES DE API — GET /posts
// ══════════════════════════════════════════════

test.describe("API — GET /posts", () => {

  test("[SUCESSO] deve retornar lista de posts com HTTP 200", async ({ request }) => {
    const response = await request.get(`${API_URL}/posts`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    // O endpoint retorna um objeto com a lista de posts
    expect(body).toBeTruthy();
    expect(typeof body).toBe("object");
  });

  test("[SUCESSO] deve respeitar o parametro limit na busca de posts", async ({ request }) => {
    const response = await request.get(`${API_URL}/posts?limit=5&skip=0`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    // Verifica que a resposta tem posts
    expect(body.posts).toBeTruthy();
    // Verifica que o limite foi respeitado
    expect(body.posts.length).toBeLessThanOrEqual(5);
  });
});
