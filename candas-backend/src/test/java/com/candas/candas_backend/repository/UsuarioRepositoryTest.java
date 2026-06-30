package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.Usuario;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.junit.jupiter.api.Assumptions;
import org.testcontainers.DockerClientFactory;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UsuarioRepositoryTest {

    static PostgreSQLContainer<?> postgres;

    static {
        try {
            if (DockerClientFactory.instance().isDockerAvailable()) {
                postgres = new PostgreSQLContainer<>("postgres:16-alpine");
                postgres.start();
            }
        } catch (Throwable e) {
            System.out.println("Docker no disponible: " + e.getMessage());
        }
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        if (postgres != null && postgres.isRunning()) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
        }
    }

    @BeforeAll
    static void checkDocker() {
        Assumptions.assumeTrue(postgres != null && postgres.isRunning(),
                "Docker no está disponible. Saltando test de integración con Testcontainers.");
    }

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void connectionEstablished() {
        assertThat(postgres).isNotNull();
        assertThat(postgres.isRunning()).isTrue();
    }

    @Test
    void shouldFindNoneByUsernameIfEmpty() {
        Optional<Usuario> user = usuarioRepository.findByUsername("nonexistent");
        assertThat(user).isEmpty();
    }
}
