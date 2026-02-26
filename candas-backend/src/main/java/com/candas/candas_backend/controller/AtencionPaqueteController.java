package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.AtencionPaqueteDTO;
import com.candas.candas_backend.service.AtencionPaqueteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import com.candas.candas_backend.util.PermissionConstants;

@RestController
@RequestMapping("/api/v1/atenciones")
@Tag(name = "Atención Paquetes", description = "Endpoints para gestión de atención de paquetes")
@CrossOrigin(origins = "*")
public class AtencionPaqueteController {

    private final AtencionPaqueteService atencionPaqueteService;

    public AtencionPaqueteController(AtencionPaqueteService atencionPaqueteService) {
        this.atencionPaqueteService = atencionPaqueteService;
    }

    @GetMapping
    @Operation(summary = "Listar solicitudes de atención")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.ATENCION_PAQUETES_LISTAR + "') or hasAuthority('" + PermissionConstants.ATENCION_PAQUETES_VER + "')")
    public ResponseEntity<Page<AtencionPaqueteDTO>> findAll(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        com.candas.candas_backend.entity.enums.EstadoAtencion estadoEnum = parseEstado(estado);
        return ResponseEntity.ok(atencionPaqueteService.findAll(estadoEnum, search, pageable));
    }

    private static com.candas.candas_backend.entity.enums.EstadoAtencion parseEstado(String estado) {
        if (estado == null || estado.isBlank() || "all".equalsIgnoreCase(estado)) {
            return null;
        }
        try {
            return com.candas.candas_backend.entity.enums.EstadoAtencion.valueOf(estado.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener atención por ID")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.ATENCION_PAQUETES_VER + "')")
    public ResponseEntity<AtencionPaqueteDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(atencionPaqueteService.findById(id));
    }

    @GetMapping("/paquete/{idPaquete}")
    @Operation(summary = "Obtener atenciones de un paquete")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.ATENCION_PAQUETES_VER + "')")
    public ResponseEntity<List<AtencionPaqueteDTO>> findByPaquete(@PathVariable Long idPaquete) {
        return ResponseEntity.ok(atencionPaqueteService.findByPaquete(idPaquete));
    }

    @GetMapping("/pendientes")
    @Operation(summary = "Obtener atenciones pendientes")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.ATENCION_PAQUETES_VER + "')")
    public ResponseEntity<List<AtencionPaqueteDTO>> findPendientes() {
        return ResponseEntity.ok(atencionPaqueteService.findPendientes());
    }

    @PostMapping
    @Operation(summary = "Crear solicitud de atención")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.ATENCION_PAQUETES_CREAR + "')")
    public ResponseEntity<AtencionPaqueteDTO> create(@Valid @RequestBody AtencionPaqueteDTO dto) {
        return new ResponseEntity<>(atencionPaqueteService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar atención")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.ATENCION_PAQUETES_EDITAR + "')")
    public ResponseEntity<AtencionPaqueteDTO> update(@PathVariable Long id,
            @Valid @RequestBody AtencionPaqueteDTO dto) {
        return ResponseEntity.ok(atencionPaqueteService.update(id, dto));
    }

    @PutMapping("/{id}/resolver")
    @Operation(summary = "Resolver solicitud de atención")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.ATENCION_PAQUETES_EDITAR + "')")
    public ResponseEntity<AtencionPaqueteDTO> resolver(@PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String observaciones = request.getOrDefault("observacionesResolucion", "");
        return ResponseEntity.ok(atencionPaqueteService.resolver(id, observaciones));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar atención")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.ATENCION_PAQUETES_ELIMINAR + "')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        atencionPaqueteService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
