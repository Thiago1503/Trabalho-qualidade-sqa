package com.demoapp.demo;

import com.demoapp.demo.dto.UserDTO;
import com.demoapp.demo.model.User;
import com.demoapp.demo.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

/**
 * Testes de integração para AuthController.
 *
 * BUGS INTENCIONAIS CAPTURADOS:
 *  - O endpoint POST /auth/signup retorna a mensagem "E-mail já está em uso"
 *    quando o e-mail já está cadastrado, mas o requisito exige "E-mail já cadastrado".
 */
@SpringBootTest
@AutoConfigureMockMvc
public class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    // ─────────────────────────────────────────────
    //  TESTES DE SUCESSO (devem PASSAR)
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("[SUCESSO] POST /auth/signup deve cadastrar novo usuário e retornar 200")
    void testSignup_novoUsuario_deveRetornar200() throws Exception {
        UserDTO dto = new UserDTO();
        dto.setEmail("novo@email.com");
        dto.setPassword("Senha@123");

        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("novo@email.com"));
    }

    @Test
    @DisplayName("[SUCESSO] POST /auth/signup deve retornar 422 para e-mail inválido")
    void testSignup_emailInvalido_deveRetornar422() throws Exception {
        UserDTO dto = new UserDTO();
        dto.setEmail("email-sem-arroba");
        dto.setPassword("Senha@123");

        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value("E-mail inválido"));
    }

    @Test
    @DisplayName("[SUCESSO] POST /auth/signin deve autenticar usuário existente e retornar 200")
    void testSignin_credenciaisCorretas_deveRetornar200() throws Exception {
        // Pré-condição: cadastrar usuário
        UserDTO signupDto = new UserDTO();
        signupDto.setEmail("usuario@email.com");
        signupDto.setPassword("Senha@123");

        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(signupDto)))
                .andExpect(status().isOk());

        // Teste de login
        mockMvc.perform(post("/auth/signin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(signupDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("usuario@email.com"));
    }

    @Test
    @DisplayName("[SUCESSO] POST /auth/signin deve retornar 401 para credenciais inválidas")
    void testSignin_credenciaisErradas_deveRetornar401() throws Exception {
        UserDTO dto = new UserDTO();
        dto.setEmail("inexistente@email.com");
        dto.setPassword("Senha@123");

        mockMvc.perform(post("/auth/signin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Credenciais inválidas"));
    }

    @Test
    @DisplayName("[SUCESSO] POST /auth/reset-password deve retornar 404 para e-mail não cadastrado")
    void testResetPassword_emailNaoExiste_deveRetornar404() throws Exception {
        String body = "{\"email\": \"naoexiste@email.com\"}";

        mockMvc.perform(post("/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Usuário não encontrado"));
    }

    /**
     * BUG: Ao tentar cadastrar um e-mail já existente, o backend retorna
     *      a mensagem "E-mail já está em uso" (HTTP 409), mas o requisito
     *      especifica que a mensagem deve ser "E-mail já cadastrado".
     *
     * Este teste FALHA porque a mensagem retornada não corresponde ao requisito.
     */
    @Test
    @DisplayName("[BUG] POST /auth/signup deve retornar mensagem 'E-mail já cadastrado' para e-mail duplicado")
    void testSignup_emailDuplicado_mensagemIncorreta_BUG() throws Exception {
        // Cadastrar o usuário pela primeira vez
        UserDTO dto = new UserDTO();
        dto.setEmail("duplicado@email.com");
        dto.setPassword("Senha@123");

        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());

        // Tentar cadastrar novamente com o mesmo e-mail
        // BUG: a mensagem retornada é "E-mail já está em uso", não "E-mail já cadastrado"
        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(
                        "E-mail já cadastrado"  // ← mensagem esperada pelo requisito
                ));
        // O backend retorna "E-mail já está em uso" → FALHA aqui
    }
}
