package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.EnsacadoUltimaBusquedaRequestDTO;
import com.candas.candas_backend.service.EnsacadoService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class EnsacadoControllerTest {

    private final EnsacadoService ensacadoService = mock(EnsacadoService.class);
    private final EnsacadoController controller = new EnsacadoController(ensacadoService);

    @AfterEach
    void limpiarContextoDeSeguridad() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void marcarEnsacadoRespondeSinContenido() {
        var response = controller.marcarEnsacado(11454L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getBody()).isNull();
        verify(ensacadoService).marcarPaqueteComoEnsacado(11454L);
    }

    @Test
    void desmarcarEnsacadoRespondeSinContenido() {
        var response = controller.desmarcarEnsacado(11454L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getBody()).isNull();
        verify(ensacadoService).desmarcarPaqueteEnsacado(11454L);
    }

    @Test
    void actualizarUltimaBusquedaRespondeSinContenido() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("operador", null, List.of()));

        var response = controller.actualizarUltimaBusqueda(
                new EnsacadoUltimaBusquedaRequestDTO("GUIA-123"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getBody()).isNull();
        verify(ensacadoService).actualizarUltimaBusqueda("operador", "GUIA-123");
    }
}
