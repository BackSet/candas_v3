package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.DespachoMasivoSessionRequestDTO;
import com.candas.candas_backend.dto.DespachoMasivoSessionResponseDTO;
import com.candas.candas_backend.service.DespachoMasivoSesionService;
import com.candas.candas_backend.util.PermissionConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/despacho-masivo")
@Tag(name = "Despacho Masivo", description = "Sesión para vista Ver despacho en curso. Endpoints aislados por usuario autenticado para soportar uso concurrente por varios operarios.")
@CrossOrigin(origins = "*")
public class DespachoMasivoController {

    private final DespachoMasivoSesionService despachoMasivoSesionService;

    public DespachoMasivoController(DespachoMasivoSesionService despachoMasivoSesionService) {
        this.despachoMasivoSesionService = despachoMasivoSesionService;
    }

    @GetMapping("/session")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_CREAR + "')")
    @Operation(summary = "Obtener sesión activa de despacho masivo (Ver despacho en curso)")
    public ResponseEntity<DespachoMasivoSessionResponseDTO> getSession() {
        String username = getCurrentUsername();
        return ResponseEntity.ok(despachoMasivoSesionService.getSesionActiva(username));
    }

    @PostMapping("/session")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_CREAR + "')")
    @Operation(summary = "Actualizar sesión de despacho masivo (payload del formulario)")
    public ResponseEntity<Void> updateSession(@RequestBody DespachoMasivoSessionRequestDTO body) {
        String username = getCurrentUsername();
        despachoMasivoSesionService.actualizarSesion(username, body);
        return ResponseEntity.ok().build();
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }
        return null;
    }
}
