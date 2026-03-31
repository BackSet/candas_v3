package com.candas.candas_backend.security;

import com.candas.candas_backend.exception.AgenciaAccessDeniedException;
import com.candas.candas_backend.repository.UsuarioRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Resuelve si el usuario autenticado debe operar con alcance restringido a una agencia.
 * <ul>
 *   <li>{@code ROLE_ADMIN}: sin restricción ({@link Optional#empty()}).</li>
 *   <li>Otro usuario con {@code usuario.agencia != null}: {@code Optional.of(idAgencia)}.</li>
 *   <li>Usuario sin agencia asignada: acceso denegado.</li>
 * </ul>
 */
@Component
public class AgenciaScopeResolver {

    private static final String ROLE_ADMIN = "ROLE_ADMIN";

    private final UsuarioRepository usuarioRepository;

    public AgenciaScopeResolver(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * @return {@link Optional#empty()} si no aplica filtro por agencia; si no vacío, solo datos de esa agencia.
     */
    public Optional<Long> idAgenciaRestringida() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        if ("anonymousUser".equals(authentication.getPrincipal())) {
            return Optional.empty();
        }
        boolean esAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(ROLE_ADMIN::equals);
        if (esAdmin) {
            return Optional.empty();
        }
        String username = authentication.getName();
        if (username == null || username.isBlank()) {
            throw new AgenciaAccessDeniedException("Usuario autenticado sin identificación válida para resolver agencia.");
        }
        Long idAgencia = usuarioRepository.findByUsername(username)
                .map(u -> u.getAgencia() != null ? u.getAgencia().getIdAgencia() : null)
                .orElse(null);
        if (idAgencia == null) {
            throw new AgenciaAccessDeniedException("El usuario no tiene agencia asignada.");
        }
        return Optional.of(idAgencia);
    }
}
