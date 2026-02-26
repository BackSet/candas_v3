package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.DespachoMasivoSessionRequestDTO;
import com.candas.candas_backend.dto.DespachoMasivoSessionResponseDTO;
import com.candas.candas_backend.entity.DespachoMasivoSesion;
import com.candas.candas_backend.entity.Usuario;
import com.candas.candas_backend.repository.DespachoMasivoSesionRepository;
import com.candas.candas_backend.repository.UsuarioRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;

/**
 * Servicio de sesión de despacho masivo (cola de paquetes, payload para "Ver despacho en curso").
 * <p>
 * La sesión es <strong>por usuario</strong> (id_usuario en despacho_masivo_sesion). Distintos operarios
 * tienen sesiones independientes y pueden crear despachos en paralelo sin interferencia entre sí.
 */
@Service
@Transactional
public class DespachoMasivoSesionService {

    private final DespachoMasivoSesionRepository despachoMasivoSesionRepository;
    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper;

    public DespachoMasivoSesionService(
            DespachoMasivoSesionRepository despachoMasivoSesionRepository,
            UsuarioRepository usuarioRepository,
            ObjectMapper objectMapper) {
        this.despachoMasivoSesionRepository = despachoMasivoSesionRepository;
        this.usuarioRepository = usuarioRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Obtiene la sesión activa de despacho masivo del usuario (para vista "Ver despacho en curso").
     */
    public DespachoMasivoSessionResponseDTO getSesionActiva(String username) {
        if (username == null || username.isBlank()) {
            return new DespachoMasivoSessionResponseDTO(null, null);
        }
        Usuario usuario = usuarioRepository.findByUsername(username).orElse(null);
        if (usuario == null) {
            return new DespachoMasivoSessionResponseDTO(null, null);
        }
        Optional<DespachoMasivoSesion> opt = despachoMasivoSesionRepository.findByUsuarioIdUsuario(usuario.getIdUsuario());
        if (opt.isEmpty()) {
            return new DespachoMasivoSessionResponseDTO(null, null);
        }
        DespachoMasivoSesion sesion = opt.get();
        String json = sesion.getPayloadJson();
        Map<String, Object> payload = null;
        if (json != null && !json.isBlank()) {
            try {
                payload = objectMapper.readValue(json, new TypeReference<>() {});
            } catch (Exception ignored) {
                // payload corrupto o vacío
            }
        }
        String lastUpdated = sesion.getUpdatedAt().format(DateTimeFormatter.ISO_DATE_TIME);
        return new DespachoMasivoSessionResponseDTO(payload, lastUpdated);
    }

    /**
     * Actualiza la sesión con el payload del formulario Crear Despacho Masivo.
     */
    public void actualizarSesion(String username, DespachoMasivoSessionRequestDTO dto) {
        if (username == null || username.isBlank()) {
            return;
        }
        Usuario usuario = usuarioRepository.findByUsername(username).orElse(null);
        if (usuario == null || usuario.getIdUsuario() == null) {
            return;
        }
        String payloadJson = null;
        if (dto != null && dto.getPayload() != null && !dto.getPayload().isEmpty()) {
            try {
                payloadJson = objectMapper.writeValueAsString(dto.getPayload());
            } catch (Exception ignored) {
                return;
            }
        }
        LocalDateTime now = LocalDateTime.now();
        despachoMasivoSesionRepository.upsertSesion(usuario.getIdUsuario(), payloadJson, now);
    }
}
