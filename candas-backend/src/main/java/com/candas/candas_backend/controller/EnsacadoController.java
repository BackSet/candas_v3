package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.DespachoEnsacadoInfoDTO;
import com.candas.candas_backend.dto.EnsacadoSessionResponseDTO;
import com.candas.candas_backend.dto.EnsacadoUltimaBusquedaRequestDTO;
import com.candas.candas_backend.dto.PaqueteEnsacadoInfoDTO;
import com.candas.candas_backend.dto.SacaEnsacadoInfoDTO;
import com.candas.candas_backend.service.EnsacadoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.format.annotation.DateTimeFormat.ISO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/ensacado")
@Tag(name = "Ensacado", description = "Endpoints para operaciones de ensacado")
@CrossOrigin(origins = "*")
public class EnsacadoController {

    private final EnsacadoService ensacadoService;

    public EnsacadoController(EnsacadoService ensacadoService) {
        this.ensacadoService = ensacadoService;
    }

    @GetMapping("/buscar-paquete/{numeroGuia}")
    @Operation(summary = "Buscar paquete para ensacar")
    public ResponseEntity<PaqueteEnsacadoInfoDTO> buscarPaquete(@PathVariable String numeroGuia) {
        return ResponseEntity.ok(ensacadoService.buscarPaqueteParaEnsacar(numeroGuia));
    }

    @PostMapping("/marcar-ensacado/{idPaquete}")
    @Operation(summary = "Marcar paquete como ensacado")
    public ResponseEntity<Void> marcarEnsacado(@PathVariable Long idPaquete) {
        ensacadoService.marcarPaqueteComoEnsacado(idPaquete);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/despachos/en-progreso")
    @Operation(summary = "Obtener despachos en progreso (opcional: filtrar por periodo)")
    public ResponseEntity<List<DespachoEnsacadoInfoDTO>> obtenerDespachosEnProgreso(
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate fechaFin) {
        return ResponseEntity.ok(ensacadoService.obtenerDespachosEnProgreso(fechaInicio, fechaFin));
    }

    @GetMapping("/despachos/completados")
    @Operation(summary = "Obtener despachos completados")
    public ResponseEntity<List<DespachoEnsacadoInfoDTO>> obtenerDespachosCompletados() {
        return ResponseEntity.ok(ensacadoService.obtenerDespachosCompletados());
    }

    @GetMapping("/despacho/{idDespacho}/info")
    @Operation(summary = "Obtener información detallada del despacho")
    public ResponseEntity<DespachoEnsacadoInfoDTO> obtenerInfoDespacho(@PathVariable Long idDespacho) {
        return ResponseEntity.ok(ensacadoService.obtenerInfoDespacho(idDespacho));
    }

    @GetMapping("/despacho/{idDespacho}/sacas/en-progreso")
    @Operation(summary = "Obtener sacas en progreso del despacho")
    public ResponseEntity<List<SacaEnsacadoInfoDTO>> obtenerSacasEnProgreso(@PathVariable Long idDespacho) {
        return ResponseEntity.ok(ensacadoService.obtenerSacasEnProgreso(idDespacho));
    }

    @GetMapping("/despacho/{idDespacho}/sacas/completadas")
    @Operation(summary = "Obtener sacas completadas del despacho")
    public ResponseEntity<List<SacaEnsacadoInfoDTO>> obtenerSacasCompletadas(@PathVariable Long idDespacho) {
        return ResponseEntity.ok(ensacadoService.obtenerSacasCompletadas(idDespacho));
    }

    @GetMapping("/session")
    @Operation(summary = "Obtener sesión activa de ensacado (para vista móvil)")
    public ResponseEntity<EnsacadoSessionResponseDTO> getSession() {
        String username = getCurrentUsername();
        return ResponseEntity.ok(ensacadoService.getSesionActiva(username));
    }

    @PostMapping("/session/ultima-busqueda")
    @Operation(summary = "Actualizar última búsqueda en la sesión de ensacado")
    public ResponseEntity<Void> actualizarUltimaBusqueda(@Valid @RequestBody EnsacadoUltimaBusquedaRequestDTO body) {
        String username = getCurrentUsername();
        ensacadoService.actualizarUltimaBusqueda(username, body.getNumeroGuia());
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
