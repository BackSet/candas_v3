package com.candas.candas_backend.security;

import com.candas.candas_backend.exception.AgenciaAccessDeniedException;
import com.candas.candas_backend.repository.AgenciaRepository;
import com.candas.candas_backend.repository.UsuarioRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

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
    public static final String HEADER_AGENCIA_ORIGEN_ACTIVA = "X-Agencia-Origen-Activa-Id";

    private final UsuarioRepository usuarioRepository;
    private final AgenciaRepository agenciaRepository;

    public AgenciaScopeResolver(UsuarioRepository usuarioRepository, AgenciaRepository agenciaRepository) {
        this.usuarioRepository = usuarioRepository;
        this.agenciaRepository = agenciaRepository;
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
        Long idAgenciaHeader = leerAgenciaOrigenActivaDesdeHeader();
        if (esAdmin) {
            if (idAgenciaHeader != null) {
                if (!agenciaRepository.existsById(idAgenciaHeader)) {
                    throw new AgenciaAccessDeniedException("La agencia origen activa seleccionada no existe.");
                }
                return Optional.of(idAgenciaHeader);
            }
            return Optional.empty();
        }
        String username = authentication.getName();
        if (username == null || username.isBlank()) {
            throw new AgenciaAccessDeniedException("Usuario autenticado sin identificación válida para resolver agencia.");
        }

        var usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new AgenciaAccessDeniedException("Usuario no encontrado para resolver agencia."));

        Set<Long> agenciasHabilitadas = new HashSet<>();
        if (usuario.getAgencias() != null) {
            usuario.getAgencias().stream()
                    .map(a -> a != null ? a.getIdAgencia() : null)
                    .filter(java.util.Objects::nonNull)
                    .forEach(agenciasHabilitadas::add);
        }
        // Compatibilidad temporal con modelo legado.
        if (usuario.getAgencia() != null && usuario.getAgencia().getIdAgencia() != null) {
            agenciasHabilitadas.add(usuario.getAgencia().getIdAgencia());
        }

        if (agenciasHabilitadas.isEmpty()) {
            throw new AgenciaAccessDeniedException("El usuario no tiene agencia asignada.");
        }

        if (idAgenciaHeader != null) {
            if (!agenciasHabilitadas.contains(idAgenciaHeader)) {
                String nombreAgencia = agenciaRepository.findById(idAgenciaHeader)
                        .map(a -> a.getNombre() != null ? a.getNombre() : "id " + idAgenciaHeader)
                        .orElse("id " + idAgenciaHeader);
                throw new AgenciaAccessDeniedException(
                        "No tienes acceso al entorno de la agencia \"" + nombreAgencia + "\".");
            }
            return Optional.of(idAgenciaHeader);
        }

        if (usuario.getAgencia() != null && usuario.getAgencia().getIdAgencia() != null) {
            return Optional.of(usuario.getAgencia().getIdAgencia());
        }
        if (agenciasHabilitadas.size() == 1) {
            return Optional.of(agenciasHabilitadas.iterator().next());
        }
        throw new AgenciaAccessDeniedException("Debes seleccionar una agencia origen activa para continuar.");
    }

    /**
     * Para operaciones de creación, exige que usuarios no-admin seleccionen explícitamente
     * una agencia origen activa mediante el header correspondiente.
     * ADMIN conserva la exención: puede operar sin header.
     */
    public Optional<Long> requireAgenciaOrigenActivaParaCreacion() {
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
        Long idAgenciaHeader = leerAgenciaOrigenActivaDesdeHeader();

        if (esAdmin && idAgenciaHeader == null) {
            return Optional.empty();
        }
        if (!esAdmin && idAgenciaHeader == null) {
            throw new AgenciaAccessDeniedException("Debes seleccionar una agencia origen activa para continuar.");
        }

        return idAgenciaRestringida();
    }

    public List<Long> agenciasHabilitadasUsuarioActual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return List.of();
        }
        return usuarioRepository.findByUsername(authentication.getName())
                .map(u -> {
                    Set<Long> ids = new HashSet<>();
                    if (u.getAgencias() != null) {
                        u.getAgencias().stream()
                                .map(a -> a != null ? a.getIdAgencia() : null)
                                .filter(java.util.Objects::nonNull)
                                .forEach(ids::add);
                    }
                    if (u.getAgencia() != null && u.getAgencia().getIdAgencia() != null) {
                        ids.add(u.getAgencia().getIdAgencia());
                    }
                    return ids.stream().toList();
                })
                .orElse(List.of());
    }

    private Long leerAgenciaOrigenActivaDesdeHeader() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null || attrs.getRequest() == null) {
            return null;
        }
        String valor = attrs.getRequest().getHeader(HEADER_AGENCIA_ORIGEN_ACTIVA);
        if (valor == null || valor.isBlank()) {
            return null;
        }
        try {
            return Long.valueOf(valor.trim());
        } catch (NumberFormatException ex) {
            throw new AgenciaAccessDeniedException("Header X-Agencia-Origen-Activa-Id inválido.");
        }
    }
}
