/*
 * BUGS CAPTURADOS:
 *  - localStorage.ts: saveUser() salva com a chave literal "user", mas
 *    getUser() lê com a constante USER_KEY = "sqa_social_media". A chave
 *    usada para salvar e para ler são diferentes, por isso o usuário nunca
 *    permanece autenticado após o cadastro/login.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockLogin = jest.fn();
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin, isAuthenticated: false, logout: jest.fn() }),
}));

// Mock do serviço de auth — simula chamadas HTTP
jest.mock("@/service/auth/auth", () => ({
  authService: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    resetPassword: jest.fn(),
  },
}));

import SignIn from "@/app/signin/page";
import SignUp from "@/app/signup/page";
import { authService } from "@/service/auth/auth";
import { saveUser, getUser } from "@/lib/localStorage";

const mockAuthService = authService as jest.Mocked<typeof authService>;

//  Testes de Integração — Tela de Login (SignIn)

describe("Integração — Tela de Login (SignIn)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("[SUCESSO] deve exibir a tela de login com campos de e-mail e senha", () => {
    render(<SignIn />);
    expect(screen.getByText("Entrar")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("seu@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("[SUCESSO] deve exibir erro de validação quando e-mail está vazio ao submeter", async () => {
    render(<SignIn />);

    // Clicar no botão submit sem preencher nada
    const submitBtn = screen.getAllByText("Entrar").find(
      (el) => el.tagName === "BUTTON" || el.closest("button")
    );
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(screen.getByText("Email é obrigatório")).toBeInTheDocument();
    });
  });

  it("[SUCESSO] deve exibir 'Credenciais inválidas' quando a API retorna 401", async () => {
    const { AxiosError } = await import("axios");
    const axiosError = new AxiosError("Unauthorized");
    axiosError.response = {
      data: { message: "Credenciais inválidas" },
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config: {} as any,
    };
    mockAuthService.signIn.mockRejectedValueOnce(axiosError);

    render(<SignIn />);

    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
      target: { value: "errado@email.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "Senha@123" },
    });

    const submitBtn = screen.getAllByText("Entrar").find(
      (el) => el.tagName === "BUTTON" || el.closest("button")
    );
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(screen.getByText("Credenciais inválidas")).toBeInTheDocument();
    });
  });

  it("[SUCESSO] deve redirecionar para '/' após login bem-sucedido", async () => {
    mockAuthService.signIn.mockResolvedValueOnce({ id: 1, email: "user@email.com" });

    render(<SignIn />);

    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
      target: { value: "user@email.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "Senha@123" },
    });

    const submitBtn = screen.getAllByText("Entrar").find(
      (el) => el.tagName === "BUTTON" || el.closest("button")
    );
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });
});

//  Testes de Integração — Tela de Cadastro (SignUp)

describe("Integração — Tela de Cadastro (SignUp)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("[SUCESSO] deve exibir a tela de cadastro com todos os campos", () => {
    render(<SignUp />);
    expect(screen.getByText("Criar Conta")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("seu@email.com")).toBeInTheDocument();
    // Dois campos de senha (Senha e Confirmar Senha)
    const senhaFields = screen.getAllByPlaceholderText("••••••••");
    expect(senhaFields).toHaveLength(2);
  });

  it("[SUCESSO] deve exibir erros de validação ao submeter formulário vazio", async () => {
    render(<SignUp />);

    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText("Email é obrigatório")).toBeInTheDocument();
      expect(screen.getByText("Senha é obrigatória")).toBeInTheDocument();
    });
  });

  it("[SUCESSO] deve exibir erro de validação para senha fraca (sem maiúscula)", async () => {
    render(<SignUp />);

    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
      target: { value: "teste@email.com" },
    });

    const [senhaField] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(senhaField, {
      target: { value: "senha@123" }, // sem maiúscula
    });

    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText(/uma letra maiúscula/i)).toBeInTheDocument();
    });
  });

  it("[SUCESSO] deve redirecionar para '/' após cadastro bem-sucedido", async () => {
    mockAuthService.signUp.mockResolvedValueOnce({ id: 2, email: "novo@email.com" });

    render(<SignUp />);

    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
      target: { value: "novo@email.com" },
    });

    const [senhaField, confirmField] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(senhaField, { target: { value: "Senha@1234" } });
    fireEvent.change(confirmField, { target: { value: "Senha@1234" } });

    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });
});

//  Teste de Integração — BUG no localStorage

/**
 * BUG: Em src/lib/localStorage.ts:
 *   - saveUser() salva com a chave literal "user"
 *   - getUser()  lê com a constante USER_KEY = "sqa_social_media"
 *
 * As chaves são diferentes, então getUser() sempre retorna null mesmo
 * após um saveUser(). Isso faz com que o usuário nunca permaneça
 * autenticado após o login/cadastro.
 *
 * Este teste FALHA para comprovar o bug.
 */
describe("Integração — BUG no localStorage (chaves inconsistentes)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("[BUG] getUser deve retornar o usuário salvo por saveUser (falha por chaves diferentes)", () => {
    const user = { id: 1, email: "teste@email.com" };

    // Salva usando saveUser (usa chave literal "user")
    saveUser(user);

    // Lê usando getUser (usa constante USER_KEY = "sqa_social_media")
    const retrieved = getUser();

    // BUG: retrieved é null porque as chaves são diferentes!
    expect(retrieved).not.toBeNull();
    // ↑ FALHA: getUser() retorna null porque procura pela chave "sqa_social_media",
    //          mas saveUser() salvou na chave "user".
    expect(retrieved?.email).toBe("teste@email.com");
  });
});
