import { test, expect } from "@playwright/test";

const EMAIL_UNICO = `teste_${Date.now()}@email.com`;
const SENHA_VALIDA = "Senha@1234";

// Função auxiliar: clica no botão de submit do formulário (main), não o do header
async function clicarBotaoFormulario(page: any, nome: RegExp) {
  await page.locator("main").getByRole("button", { name: nome }).click();
}

// ══════════════════════════════════════════════
//  TESTE E2E 1 — Fluxo completo de Cadastro
// ══════════════════════════════════════════════

test.describe("E2E — Fluxo de Cadastro (Signup)", () => {

  test("deve permitir que um novo usuario se cadastre e seja redirecionado para a pagina principal", async ({ page }) => {
    // 1. Navega para a página de cadastro
    await page.goto("/signup");

    // 2. Verifica que a página carregou pela URL
    await expect(page).toHaveURL(/signup/);

    // 3. Preenche o campo de e-mail
    await page.getByPlaceholder("seu@email.com").fill(EMAIL_UNICO);

    // 4. Preenche os campos de senha
    const senhaFields = page.getByPlaceholder("••••••••");
    await senhaFields.first().fill(SENHA_VALIDA);
    await senhaFields.last().fill(SENHA_VALIDA);

    // 5. Clica no botão de submit do FORMULÁRIO (não o do header)
    await clicarBotaoFormulario(page, /criar conta/i);

    // 6. Verifica redirecionamento para a página principal
    await expect(page).toHaveURL("http://localhost:3000/", { timeout: 10000 });

    // 7. Verifica que o header exibe botões de usuário logado
    await expect(page.getByText("Posts Curtidos")).toBeVisible();
    await expect(page.getByText("Sair")).toBeVisible();
  });

  test("deve exibir mensagem de erro ao tentar cadastrar com e-mail ja existente", async ({ page }) => {
    // 1. Primeiro cadastro — usa a API diretamente para ser mais rápido e confiável
    const response = await page.request.post("http://localhost:8080/auth/signup", {
      data: { email: EMAIL_UNICO, password: SENHA_VALIDA },
    });
    // Aceita 200 (criado) ou 409 (já existe) — em ambos os casos o e-mail existe
    expect([200, 409]).toContain(response.status());

    // 2. Agora tenta cadastrar pela tela com o mesmo e-mail
    await page.goto("/signup");
    await page.getByPlaceholder("seu@email.com").fill(EMAIL_UNICO);
    const senhaFields = page.getByPlaceholder("••••••••");
    await senhaFields.first().fill(SENHA_VALIDA);
    await senhaFields.last().fill(SENHA_VALIDA);
    await clicarBotaoFormulario(page, /criar conta/i);

    // 3. Verifica mensagem de erro
    await expect(page.getByText("E-mail já está em uso")).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/signup/);
  });

  test("deve exibir erro de validacao para senha fraca", async ({ page }) => {
    // 1. Navega para cadastro
    await page.goto("/signup");

    // 2. Preenche com senha sem letra maiúscula
    await page.getByPlaceholder("seu@email.com").fill("valido@email.com");
    const senhaFields = page.getByPlaceholder("••••••••");
    await senhaFields.first().fill("senha@123");
    await senhaFields.last().fill("senha@123");

    // 3. Tenta submeter pelo formulário
    await clicarBotaoFormulario(page, /criar conta/i);

    // 4. Verifica mensagem de erro — busca pelo texto exato da mensagem de erro principal
    await expect(page.getByText("A senha deve conter: uma letra maiúscula")).toBeVisible();
    await expect(page).toHaveURL(/signup/);
  });
});

// ══════════════════════════════════════════════
//  TESTE E2E 2 — Fluxo de Login e Curtida
// ══════════════════════════════════════════════

test.describe("E2E — Fluxo de Login (Signin) e Curtida de Post", () => {

  test.beforeEach(async ({ page }) => {
    // Garante que o usuário existe via API (mais rápido e confiável que pela tela)
    await page.request.post("http://localhost:8080/auth/signup", {
      data: { email: EMAIL_UNICO, password: SENHA_VALIDA },
    });
  });

  test("deve permitir login com credenciais corretas e redirecionar para pagina principal", async ({ page }) => {
    // 1. Navega para login
    await page.goto("/signin");
    await expect(page.getByRole("heading", { name: /entrar/i })).toBeVisible();

    // 2. Preenche credenciais
    await page.getByPlaceholder("seu@email.com").fill(EMAIL_UNICO);
    await page.getByPlaceholder("••••••••").fill(SENHA_VALIDA);

    // 3. Clica no botão do formulário
    await clicarBotaoFormulario(page, /entrar/i);

    // 4. Verifica redirecionamento
    await expect(page).toHaveURL("http://localhost:3000/", { timeout: 10000 });
    await expect(page.getByText("Posts Curtidos")).toBeVisible();
    await expect(page.getByText("Sair")).toBeVisible();
  });

  test("deve exibir 'Credenciais invalidas' para login com senha errada", async ({ page }) => {
    // 1. Navega para login
    await page.goto("/signin");

    // 2. Preenche com senha incorreta
    await page.getByPlaceholder("seu@email.com").fill(EMAIL_UNICO);
    await page.getByPlaceholder("••••••••").fill("SenhaErrada@999");

    // 3. Clica em entrar
    await clicarBotaoFormulario(page, /entrar/i);

    // 4. Verifica mensagem de erro
    await expect(page.getByText("Credenciais inválidas")).toBeVisible();
    await expect(page).toHaveURL(/signin/);
  });

  test("deve exibir alert ao tentar curtir post sem estar autenticado", async ({ page }) => {
    // 1. Navega para página principal sem estar logado
    await page.goto("/");
    await page.waitForSelector("button", { timeout: 10000 });

    // 2. Configura listener para capturar o alert
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toBe(
        "Você precisa estar autenticado para curtir posts!"
      );
      await dialog.accept();
    });

    // 3. Clica no primeiro botão Curtir
    await page.getByText("Curtir").first().click();
  });

  test("deve aplicar feedback visual ao curtir post quando autenticado", async ({ page }) => {
    // 1. Faz login
    await page.goto("/signin");
    await page.getByPlaceholder("seu@email.com").fill(EMAIL_UNICO);
    await page.getByPlaceholder("••••••••").fill(SENHA_VALIDA);
    await clicarBotaoFormulario(page, /entrar/i);
    await expect(page).toHaveURL("http://localhost:3000/", { timeout: 10000 });

    // 2. Aguarda posts carregarem
    await page.waitForSelector("button", { timeout: 10000 });

    // 3. Clica em curtir
    await page.getByText("Curtir").first().click();

    // 4. Verifica feedback visual
    await expect(page.getByText("Curtido").first()).toBeVisible();
  });
});

// ══════════════════════════════════════════════
//  TESTE E2E 3 — Navegação e Header
// ══════════════════════════════════════════════

test.describe("E2E — Navegacao e Header", () => {

  test("header deve exibir botoes corretos para usuario deslogado", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("SQA Social Media")).toBeVisible();
    await expect(page.getByText("Entrar")).toBeVisible();
    await expect(page.locator("header").getByText("Criar Conta")).toBeVisible();
    await expect(page.getByText("Posts Curtidos")).not.toBeVisible();
    await expect(page.getByText("Sair")).not.toBeVisible();
  });

  test("clicar no titulo 'SQA Social Media' deve redirecionar para a pagina principal", async ({ page }) => {
    await page.goto("/signin");
    await page.getByText("SQA Social Media").click();
    await expect(page).toHaveURL("http://localhost:3000/");
  });
});