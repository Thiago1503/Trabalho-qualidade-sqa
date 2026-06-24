import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Mocks necessários para componentes que usam Next.js / AuthContext ──

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock do AuthContext — será sobrescrito por teste quando necessário
const mockUseAuth = jest.fn();
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

import Header from "@/components/Header";
import PostCard from "@/components/PostCard";

//  Testes de Componente — Header

describe("Header — usuário deslogado", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseAuth.mockReturnValue({ isAuthenticated: false, logout: jest.fn() });
  });

  it("[SUCESSO] deve exibir o título 'SQA Social Media'", () => {
    render(<Header />);
    expect(screen.getByText("SQA Social Media")).toBeInTheDocument();
  });

  it("[SUCESSO] deve exibir botões 'Entrar' e 'Criar Conta' para usuário deslogado", () => {
    render(<Header />);
    expect(screen.getByText("Entrar")).toBeInTheDocument();
    expect(screen.getByText("Criar Conta")).toBeInTheDocument();
  });

  it("[SUCESSO] deve NÃO exibir botão 'Sair' quando usuário está deslogado", () => {
    render(<Header />);
    expect(screen.queryByText("Sair")).not.toBeInTheDocument();
  });

  it("[SUCESSO] clicar no título deve navegar para '/'", () => {
    render(<Header />);
    fireEvent.click(screen.getByText("SQA Social Media"));
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("[SUCESSO] clicar em 'Entrar' deve navegar para '/signin'", () => {
    render(<Header />);
    fireEvent.click(screen.getByText("Entrar"));
    expect(mockPush).toHaveBeenCalledWith("/signin");
  });

  it("[SUCESSO] clicar em 'Criar Conta' deve navegar para '/signup'", () => {
    render(<Header />);
    fireEvent.click(screen.getByText("Criar Conta"));
    expect(mockPush).toHaveBeenCalledWith("/signup");
  });
});

describe("Header — usuário logado", () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    mockPush.mockClear();
    mockLogout.mockClear();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, logout: mockLogout });
  });

  it("[SUCESSO] deve exibir botões 'Posts Curtidos' e 'Sair' para usuário logado", () => {
    render(<Header />);
    expect(screen.getByText("Posts Curtidos")).toBeInTheDocument();
    expect(screen.getByText("Sair")).toBeInTheDocument();
  });

  it("[SUCESSO] deve NÃO exibir 'Entrar' quando usuário está logado", () => {
    render(<Header />);
    expect(screen.queryByText("Entrar")).not.toBeInTheDocument();
  });

  it("[SUCESSO] clicar em 'Posts Curtidos' deve navegar para '/auth/liked'", () => {
    render(<Header />);
    fireEvent.click(screen.getByText("Posts Curtidos"));
    expect(mockPush).toHaveBeenCalledWith("/auth/liked");
  });

  it("[SUCESSO] clicar em 'Sair' deve chamar logout e navegar para '/'", () => {
    render(<Header />);
    fireEvent.click(screen.getByText("Sair"));
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});

//  Testes de Componente — PostCard

const mockPost = {
  id: 1,
  title: "Post de Teste",
  body: "Conteúdo do post de teste para verificar renderização.",
  liked: false,
};

describe("PostCard — renderização", () => {
  it("[SUCESSO] deve exibir título e corpo do post", () => {
    render(
      <PostCard
        post={mockPost}
        isAuthenticated={false}
        onLike={jest.fn()}
      />
    );
    expect(screen.getByText("Post de Teste")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo do post de teste para verificar renderização.")).toBeInTheDocument();
  });

  it("[SUCESSO] deve exibir botão 'Curtir' quando post não foi curtido", () => {
    render(
      <PostCard
        post={mockPost}
        isAuthenticated={false}
        onLike={jest.fn()}
      />
    );
    expect(screen.getByText("Curtir")).toBeInTheDocument();
  });

  it("[SUCESSO] deve exibir 'Curtido' quando post já foi curtido", () => {
    const likedPost = { ...mockPost, liked: true };
    render(
      <PostCard
        post={likedPost}
        isAuthenticated={true}
        onLike={jest.fn()}
      />
    );
    expect(screen.getByText("Curtido")).toBeInTheDocument();
  });
});

describe("PostCard — interação de curtir", () => {
  it("[SUCESSO] deve exibir alert para usuário não autenticado ao clicar em Curtir", () => {
    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <PostCard
        post={mockPost}
        isAuthenticated={false}
        onLike={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText("Curtir"));
    expect(alertMock).toHaveBeenCalledWith(
      "Você precisa estar autenticado para curtir posts!"
    );

    alertMock.mockRestore();
  });

  it("[SUCESSO] deve chamar onLike com o id do post ao clicar para usuário autenticado", async () => {
    const onLikeMock = jest.fn().mockResolvedValue(undefined);

    render(
      <PostCard
        post={mockPost}
        isAuthenticated={true}
        onLike={onLikeMock}
      />
    );

    fireEvent.click(screen.getByText("Curtir"));
    expect(onLikeMock).toHaveBeenCalledWith(1);
  });
});
