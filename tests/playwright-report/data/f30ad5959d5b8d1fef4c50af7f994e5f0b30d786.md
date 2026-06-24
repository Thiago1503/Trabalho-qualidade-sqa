# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.spec.ts >> API — POST /auth/signup >> [BUG] deve retornar mensagem 'E-mail ja cadastrado' para e-mail duplicado
- Location: src\api.spec.ts:84:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "E-mail já cadastrado"
Received: "E-mail já está em uso"
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * TESTES DE API — Caixa Preta
  5   |  *
  6   |  * Testam os endpoints da API diretamente via HTTP, sem passar pelo frontend.
  7   |  * São chamados "caixa preta" porque testamos apenas o comportamento externo
  8   |  * (entrada e saída) sem conhecer a implementação interna.
  9   |  *
  10  |  * Pré-requisito: Backend rodando em http://localhost:8080
  11  |  *
  12  |  * Endpoints testados:
  13  |  *   POST /auth/signup
  14  |  *   POST /auth/signin
  15  |  *   POST /auth/reset-password
  16  |  *   GET  /posts
  17  |  */
  18  | 
  19  | const API_URL = "http://localhost:8080";
  20  | 
  21  | // E-mail único por execução
  22  | const EMAIL_API = `api_teste_${Date.now()}@email.com`;
  23  | const SENHA_VALIDA = "Senha@1234";
  24  | 
  25  | // ══════════════════════════════════════════════
  26  | //  TESTES DE API — POST /auth/signup
  27  | // ══════════════════════════════════════════════
  28  | 
  29  | test.describe("API — POST /auth/signup", () => {
  30  | 
  31  |   test("[SUCESSO] deve cadastrar novo usuario e retornar HTTP 200 com dados do usuario", async ({ request }) => {
  32  |     // Faz a requisição POST para signup com dados válidos
  33  |     const response = await request.post(`${API_URL}/auth/signup`, {
  34  |       data: {
  35  |         email: EMAIL_API,
  36  |         password: SENHA_VALIDA,
  37  |       },
  38  |     });
  39  | 
  40  |     // Verifica que retornou HTTP 200
  41  |     expect(response.status()).toBe(200);
  42  | 
  43  |     // Verifica o corpo da resposta
  44  |     const body = await response.json();
  45  |     expect(body.email).toBe(EMAIL_API);
  46  |     expect(body.id).toBeTruthy(); // id foi gerado
  47  |   });
  48  | 
  49  |   test("[SUCESSO] deve retornar HTTP 422 para e-mail invalido", async ({ request }) => {
  50  |     const response = await request.post(`${API_URL}/auth/signup`, {
  51  |       data: {
  52  |         email: "emailsemarroba",
  53  |         password: SENHA_VALIDA,
  54  |       },
  55  |     });
  56  | 
  57  |     // Verifica que retornou HTTP 422 (Unprocessable Entity)
  58  |     expect(response.status()).toBe(422);
  59  | 
  60  |     const body = await response.json();
  61  |     expect(body.message).toBe("E-mail inválido");
  62  |   });
  63  | 
  64  |   test("[SUCESSO] deve retornar HTTP 422 para senha fraca (sem maiuscula)", async ({ request }) => {
  65  |     const response = await request.post(`${API_URL}/auth/signup`, {
  66  |       data: {
  67  |         email: "novo@email.com",
  68  |         password: "senha@123", // sem maiúscula
  69  |       },
  70  |     });
  71  | 
  72  |     expect(response.status()).toBe(422);
  73  | 
  74  |     const body = await response.json();
  75  |     expect(body.message).toBe("Senha inválida");
  76  |   });
  77  | 
  78  |   /**
  79  |    * BUG CAPTURADO:
  80  |    * Ao tentar cadastrar um e-mail duplicado, a API retorna a mensagem
  81  |    * "E-mail já está em uso", mas o requisito exige "E-mail já cadastrado".
  82  |    * Este teste FALHA intencionalmente para comprovar o bug.
  83  |    */
  84  |   test("[BUG] deve retornar mensagem 'E-mail ja cadastrado' para e-mail duplicado", async ({ request }) => {
  85  |     // Primeiro cadastro
  86  |     await request.post(`${API_URL}/auth/signup`, {
  87  |       data: { email: EMAIL_API, password: SENHA_VALIDA },
  88  |     });
  89  | 
  90  |     // Segunda tentativa com o mesmo e-mail
  91  |     const response = await request.post(`${API_URL}/auth/signup`, {
  92  |       data: { email: EMAIL_API, password: SENHA_VALIDA },
  93  |     });
  94  | 
  95  |     expect(response.status()).toBe(409);
  96  | 
  97  |     const body = await response.json();
  98  |     // BUG: a API retorna "E-mail já está em uso" em vez de "E-mail já cadastrado"
> 99  |     expect(body.message).toBe("E-mail já cadastrado");
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  100 |     // ↑ FALHA: retorna "E-mail já está em uso"
  101 |   });
  102 | });
  103 | 
  104 | // ══════════════════════════════════════════════
  105 | //  TESTES DE API — POST /auth/signin
  106 | // ══════════════════════════════════════════════
  107 | 
  108 | test.describe("API — POST /auth/signin", () => {
  109 | 
  110 |   test.beforeAll(async ({ request }) => {
  111 |     // Garante que o usuario de teste existe antes dos testes de login
  112 |     await request.post(`${API_URL}/auth/signup`, {
  113 |       data: { email: EMAIL_API, password: SENHA_VALIDA },
  114 |     });
  115 |   });
  116 | 
  117 |   test("[SUCESSO] deve autenticar usuario com credenciais corretas e retornar HTTP 200", async ({ request }) => {
  118 |     const response = await request.post(`${API_URL}/auth/signin`, {
  119 |       data: {
  120 |         email: EMAIL_API,
  121 |         password: SENHA_VALIDA,
  122 |       },
  123 |     });
  124 | 
  125 |     expect(response.status()).toBe(200);
  126 | 
  127 |     const body = await response.json();
  128 |     expect(body.email).toBe(EMAIL_API);
  129 |     expect(body.id).toBeTruthy();
  130 |   });
  131 | 
  132 |   test("[SUCESSO] deve retornar HTTP 401 e mensagem 'Credenciais invalidas' para senha errada", async ({ request }) => {
  133 |     const response = await request.post(`${API_URL}/auth/signin`, {
  134 |       data: {
  135 |         email: EMAIL_API,
  136 |         password: "SenhaErrada@999",
  137 |       },
  138 |     });
  139 | 
  140 |     expect(response.status()).toBe(401);
  141 | 
  142 |     const body = await response.json();
  143 |     expect(body.message).toBe("Credenciais inválidas");
  144 |   });
  145 | 
  146 |   test("[SUCESSO] deve retornar HTTP 401 para e-mail nao cadastrado", async ({ request }) => {
  147 |     const response = await request.post(`${API_URL}/auth/signin`, {
  148 |       data: {
  149 |         email: "naocadastrado@email.com",
  150 |         password: SENHA_VALIDA,
  151 |       },
  152 |     });
  153 | 
  154 |     expect(response.status()).toBe(401);
  155 | 
  156 |     const body = await response.json();
  157 |     expect(body.message).toBe("Credenciais inválidas");
  158 |   });
  159 | });
  160 | 
  161 | // ══════════════════════════════════════════════
  162 | //  TESTES DE API — POST /auth/reset-password
  163 | // ══════════════════════════════════════════════
  164 | 
  165 | test.describe("API — POST /auth/reset-password", () => {
  166 | 
  167 |   test("[SUCESSO] deve retornar HTTP 404 e 'Usuario nao encontrado' para e-mail nao cadastrado", async ({ request }) => {
  168 |     const response = await request.post(`${API_URL}/auth/reset-password`, {
  169 |       data: { email: "inexistente@email.com" },
  170 |     });
  171 | 
  172 |     expect(response.status()).toBe(404);
  173 | 
  174 |     const body = await response.json();
  175 |     expect(body.message).toBe("Usuário não encontrado");
  176 |   });
  177 | 
  178 |   test("[SUCESSO] deve retornar HTTP 200 para e-mail cadastrado", async ({ request }) => {
  179 |     // Garante que o usuário existe
  180 |     await request.post(`${API_URL}/auth/signup`, {
  181 |       data: { email: EMAIL_API, password: SENHA_VALIDA },
  182 |     });
  183 | 
  184 |     const response = await request.post(`${API_URL}/auth/reset-password`, {
  185 |       data: { email: EMAIL_API },
  186 |     });
  187 | 
  188 |     expect(response.status()).toBe(200);
  189 |   });
  190 | });
  191 | 
  192 | // ══════════════════════════════════════════════
  193 | //  TESTES DE API — GET /posts
  194 | // ══════════════════════════════════════════════
  195 | 
  196 | test.describe("API — GET /posts", () => {
  197 | 
  198 |   test("[SUCESSO] deve retornar lista de posts com HTTP 200", async ({ request }) => {
  199 |     const response = await request.get(`${API_URL}/posts`);
```