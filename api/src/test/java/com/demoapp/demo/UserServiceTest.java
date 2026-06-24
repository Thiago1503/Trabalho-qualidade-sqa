package com.demoapp.demo;

import com.demoapp.demo.service.UserService;
import com.demoapp.demo.repository.UserRepository;
import com.demoapp.demo.model.User;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Testes unitários para UserService.
 *
 * BUGS INTENCIONAIS CAPTURADOS:
 *  - isEmailValid() aceita strings sem domínio completo (ex: "a@" ou "@b"),
 *    pois só verifica a presença do caractere '@'.
 *    O requisito exige validação de e-mail completa.
 */
public class UserServiceTest {

    private UserService userService;
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        userService = new UserService(userRepository);
    }

    //  TESTES DE SUCESSO (devem PASSAR)

    @Test
    @DisplayName("[SUCESSO] isPasswordValid deve aceitar senha que atende todos os critérios")
    void testIsPasswordValid_senhaForte_deveRetornarTrue() {
        // Senha com maiúscula, minúscula, número e caractere especial, >= 8 chars
        assertTrue(userService.isPasswordValid("Senha@123"),
                "Senha forte deve ser considerada válida");
    }

    @Test
    @DisplayName("[SUCESSO] isPasswordValid deve rejeitar senha sem letra maiúscula")
    void testIsPasswordValid_semMaiuscula_deveRetornarFalse() {
        assertFalse(userService.isPasswordValid("senha@123"),
                "Senha sem maiúscula deve ser inválida");
    }

    @Test
    @DisplayName("[SUCESSO] isPasswordValid deve rejeitar senha curta (menos de 8 chars)")
    void testIsPasswordValid_muitoCurta_deveRetornarFalse() {
        assertFalse(userService.isPasswordValid("Ab@1"),
                "Senha com menos de 8 caracteres deve ser inválida");
    }

    @Test
    @DisplayName("[SUCESSO] createUser deve salvar e retornar o usuário criado")
    void testCreateUser_deveRetornarUsuarioCriado() {
        User mockUser = new User();
        mockUser.setEmail("teste@email.com");
        mockUser.setPassword("Senha@123");

        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        User result = userService.createUser("teste@email.com", "Senha@123");

        assertNotNull(result, "Usuário criado não deve ser nulo");
        assertEquals("teste@email.com", result.getEmail());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("[SUCESSO] findByEmail deve retornar null quando e-mail não existe")
    void testFindByEmail_naoEncontrado_deveRetornarNull() {
        when(userRepository.findByEmail("inexistente@email.com"))
                .thenReturn(Optional.empty());

        User result = userService.findByEmail("inexistente@email.com");

        assertNull(result, "Deve retornar null para e-mail não cadastrado");
    }

    @Test
    @DisplayName("[SUCESSO] findByEmail deve retornar usuário quando e-mail existe")
    void testFindByEmail_encontrado_deveRetornarUsuario() {
        User mockUser = new User();
        mockUser.setEmail("cadastrado@email.com");

        when(userRepository.findByEmail("cadastrado@email.com"))
                .thenReturn(Optional.of(mockUser));

        User result = userService.findByEmail("cadastrado@email.com");

        assertNotNull(result);
        assertEquals("cadastrado@email.com", result.getEmail());
    }


    //  TESTE DE BUG (deve FALHAR — captura o bug)

    /**
     * BUG: isEmailValid() usa apenas email.contains("@"), portanto aceita strings
     * como "usuario@" (sem domínio) ou "@dominio" (sem usuário) como e-mails válidos.
     *
     * REQUISITO: O sistema deve validar se o e-mail possui formato completo
     *            (usuário@domínio.extensão).
     *
     * Este teste FALHA porque isEmailValid("usuario@") retorna TRUE,
     * mas deveria retornar FALSE.
     */
    @Test
    @DisplayName("[BUG] isEmailValid NÃO deve aceitar e-mail sem domínio (ex: 'usuario@')")
    void testIsEmailValid_semDominio_deveRetornarFalse_BUG() {
        // Este teste FALHA intencionalmente para capturar o bug:
        // isEmailValid("usuario@") retorna TRUE porque só verifica se há '@'
        assertFalse(userService.isEmailValid("usuario@"),
                "BUG CAPTURADO: e-mail sem domínio está sendo aceito como válido. " +
                "A validação atual usa apenas contains('@'), que é insuficiente.");
    }
}
