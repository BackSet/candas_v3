package com.candas.candas_backend.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.InsufficientAuthenticationException;

import static org.assertj.core.api.Assertions.assertThat;

class JwtAuthenticationEntryPointTest {

    private final ObjectMapper objectMapper = new JacksonConfig().objectMapper();
    private final JwtAuthenticationEntryPoint entryPoint = new JwtAuthenticationEntryPoint(objectMapper);

    @Test
    void respondeJsonCuandoFaltaLaAutenticacion() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/ensacado/session/ultima-busqueda");
        MockHttpServletResponse response = new MockHttpServletResponse();

        entryPoint.commence(
                request,
                response,
                new InsufficientAuthenticationException("Authentication required"));

        JsonNode body = objectMapper.readTree(response.getContentAsString());

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).isEqualTo("application/json;charset=UTF-8");
        assertThat(body.path("status").asInt()).isEqualTo(401);
        assertThat(body.path("error").asText()).isEqualTo("No autorizado");
        assertThat(body.path("path").asText()).isEqualTo("/api/v1/ensacado/session/ultima-busqueda");
    }
}
