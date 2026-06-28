/*
 * Testes de Integração
 *
 * Valida:
 * - Fluxo de Login
 * - Fluxo de Cadastro
 * - Persistência do usuário no localStorage
 *
 * O bug existente na Atividade 4 (saveUser usando chave diferente de getUser)
 * foi corrigido nesta versão.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockLogin = jest.fn();
jest.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin, isAuthenticated: false, logout: jest.fn() }),
}));

// Mock responsável por simular as respostas da API de autenticação
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
function getSubmitButton() {
  const form = document.querySelector("form");
  if (!form) {
    throw new Error("Formulário não encontrado.");
  }

  return form.querySelector(
    'button[type="submit"]'
  ) as HTMLButtonElement;
}

//  Testes de Integração — Tela de Login (SignIn)

describe("Integração — Tela de Login (SignIn)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("[SUCESSO] deve exibir a tela de login com campos de e-mail e senha", () => {
    render(<SignIn />);
   expect(
  screen.getByRole("heading", { name: "Entrar" })
).toBeInTheDocument();
    expect(screen.getByPlaceholderText("seu@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("[SUCESSO] deve exibir erro de validação quando e-mail está vazio ao submeter", async () => {
    render(<SignIn />);

    // Clicar no botão submit sem preencher nada
    fireEvent.click(getSubmitButton());

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

    fireEvent.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText("Credenciais inválidas")).toBeInTheDocument();
    });
  });

  it("[SUCESSO] deve redirecionar para '/' após login bem-sucedido", async () => {
  mockAuthService.signIn.mockResolvedValueOnce({
    id: 1,
    email: "user@email.com",
  });

  render(<SignIn />);

  fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
    target: { value: "user@email.com" },
  });

  fireEvent.change(screen.getByPlaceholderText("••••••••"), {
    target: { value: "Senha@123" },
  });

  fireEvent.click(getSubmitButton());

  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalledWith({
      id: 1,
      email: "user@email.com",
    });

    expect(mockLogin).toHaveBeenCalledWith({
  id: 1,
  email: "user@email.com",
});

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
    expect(
  screen.getByRole("heading", { name: "Criar Conta" })
).toBeInTheDocument();
    expect(screen.getByPlaceholderText("seu@email.com")).toBeInTheDocument();
    // Dois campos de senha (Senha e Confirmar Senha)
    const senhaFields = screen.getAllByPlaceholderText("••••••••");
    expect(senhaFields).toHaveLength(2);
  });

  it("[SUCESSO] deve exibir erros de validação ao submeter formulário vazio", async () => {
    render(<SignUp />);

    fireEvent.click(getSubmitButton());

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

    fireEvent.click(getSubmitButton());

    await waitFor(() => {
      expect(
  screen.getByText(
    "A senha deve conter: uma letra maiúscula"
  )
).toBeInTheDocument();
    });
  });

  it("[SUCESSO] deve redirecionar para '/' após cadastro bem-sucedido", async () => {
  mockAuthService.signUp.mockResolvedValueOnce({
    id: 2,
    email: "novo@email.com",
  });

  render(<SignUp />);

  fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
    target: { value: "novo@email.com" },
  });

  const [senhaField, confirmField] =
    screen.getAllByPlaceholderText("••••••••");

  fireEvent.change(senhaField, {
    target: { value: "Senha@1234" },
  });

  fireEvent.change(confirmField, {
    target: { value: "Senha@1234" },
  });

 fireEvent.click(
  document.querySelector(
    'form button[type="submit"]'
  ) as HTMLButtonElement
);
  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalledWith({
      id: 2,
      email: "novo@email.com",
    });

    expect(mockLogin).toHaveBeenCalledWith({
  id: 2,
  email: "novo@email.com",
});

expect(mockPush).toHaveBeenCalledWith("/");
  });
});
});

// Testes responsáveis por validar a persistência do usuário no localStorage

describe("Integração — Persistência do usuário", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("[SUCESSO] deve recuperar o usuário salvo no localStorage", () => {
    const user = {
      id: 1,
      email: "teste@email.com",
    };

    saveUser(user);

    const retrieved = getUser();

    expect(retrieved).not.toBeNull();
    expect(retrieved?.email).toBe("teste@email.com");
    expect(retrieved?.id).toBe(1);
  });
});
