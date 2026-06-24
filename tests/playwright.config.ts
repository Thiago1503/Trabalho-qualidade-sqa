import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Pasta onde estão os arquivos de teste
  testDir: "./src",

  // Tempo máximo por teste (30 segundos)
  timeout: 30_000,

  // Configurações de relatório: mostra resultados no terminal
  reporter: [["list"], ["html", { open: "never" }]],

  // Configurações compartilhadas por todos os testes
  use: {
    // URL base do frontend
    baseURL: "http://localhost:3000",

    // Captura screenshot apenas quando o teste falha
    screenshot: "only-on-failure",
  },

  // Projetos: define quais browsers rodar
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
