"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Input from "@/components/Input";
import Button from "@/components/Button";
import TextButton from "@/components/TextButton";
import { authService } from "@/service/auth/auth";
import { isEmailValid, getEmailValidationMessage } from "@/utils/email";
import { useAuth } from "@/contexts/AuthContext";
import { AxiosError } from "axios";

export default function SignIn() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  //Valida todos os campos antes de enviar para a API
  function validateForm(): boolean {
    let isValid = true;

    if (!email) {
      setEmailError("Email é obrigatório");
      isValid = false;
    } else if (!isEmailValid(email)) {
      setEmailError(getEmailValidationMessage(email));
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError("Senha é obrigatória");
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  }

  //Envia os dados para autenticação
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.signIn({ email, password });
      login({ id: response.id, email: response.email });
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message ||
            "Erro ao fazer login. Verifique suas credenciais."
        );
      } else {
        setError("Erro ao fazer login. Verifique suas credenciais.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Header />

      <main
        style={{
          maxWidth: "400px",
          margin: "0 auto",
          padding: "2rem",
        }}
      >
        <div
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
            padding: "2rem",
            marginTop: "2rem",
          }}
        >
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: "bold",
              marginBottom: "1.5rem",
              textAlign: "center",
              color: "var(--foreground)",
            }}
          >
            Entrar
          </h1>

          {error && (
            <div
              style={{
                background: "var(--error)",
                color: "white",
                padding: "0.75rem",
                borderRadius: "0.375rem",
                marginBottom: "1rem",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              placeholder="seu@email.com"
            />

            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordError}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              isLoading={isLoading}
              style={{ width: "100%", marginTop: "1rem" }}
            >
              Entrar
            </Button>
          </form>

          <div
            style={{
              marginTop: "1.5rem",
              textAlign: "center",
              fontSize: "0.875rem",
            }}
          >
            <TextButton onClick={() => router.push("/reset-password")}>
              Esqueci minha senha
            </TextButton>
          </div>

          <div
            style={{
              marginTop: "1rem",
              textAlign: "center",
              fontSize: "0.875rem",
              color: "var(--foreground)",
              opacity: 0.8,
            }}
          >
            Não tem uma conta?{" "}
            <TextButton onClick={() => router.push("/signup")}>
              Criar conta
            </TextButton>
          </div>
        </div>
      </main>
    </div>
  );
}
