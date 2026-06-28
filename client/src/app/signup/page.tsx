"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Input from "@/components/Input";
import Button from "@/components/Button";
import TextButton from "@/components/TextButton";
import { authService } from "@/service/auth/auth";
import { isEmailValid, getEmailValidationMessage } from "@/utils/email";
import {
  isPasswordValid,
  getPasswordValidationMessage,
} from "@/utils/password";
import { useAuth } from "@/contexts/AuthContext";
import { AxiosError } from "axios";

export default function SignUp() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Validação dos dados informados pelo usuário
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
    } else if (!isPasswordValid(password)) {
      setPasswordError(getPasswordValidationMessage(password));
      isValid = false;
    } else {
      setPasswordError("");
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Confirmação de senha é obrigatória");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("As senhas não coincidem");
      isValid = false;
    } else {
      setConfirmPasswordError("");
    }

    return isValid;
  }

  //Realiza o cadastro e autentifica automaticamente o usuário
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.signUp({ email, password });
      login({ id: response.id, email: response.email });
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setGeneralError(
          err.response?.data?.message || "Erro ao criar conta. Tente novamente."
        );
      } else {
        setGeneralError("Erro ao criar conta. Tente novamente.");
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
            Criar Conta
          </h1>

          {generalError && (
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
              {generalError}
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

            <Input
              label="Confirmar Senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPasswordError}
              placeholder="••••••••"
            />

            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--foreground)",
                opacity: 0.7,
                marginBottom: "1rem",
                lineHeight: "1.5",
              }}
            >
              A senha deve conter:
              <ul style={{ marginTop: "0.25rem", marginLeft: "1.25rem" }}>
                <li>Mínimo de 8 caracteres</li>
                <li>Pelo menos uma letra maiúscula</li>
                <li>Pelo menos uma letra minúscula</li>
                <li>Pelo menos um número</li>
                <li>Pelo menos um caractere especial</li>
              </ul>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              style={{ width: "100%", marginTop: "1rem" }}
            >
              Criar Conta
            </Button>
          </form>

          <div
            style={{
              marginTop: "1.5rem",
              textAlign: "center",
              fontSize: "0.875rem",
              color: "var(--foreground)",
              opacity: 0.8,
            }}
          >
            Já tem uma conta?{" "}
            <TextButton onClick={() => router.push("/signin")}>
              Entrar
            </TextButton>
          </div>
        </div>
      </main>
    </div>
  );
}
