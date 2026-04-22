package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.DestinatarioDirectoDTO;
import com.candas.candas_backend.service.DestinatarioDirectoService;
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
import com.candas.candas_backend.util.PermissionConstants;

@RestController
@RequestMapping("/api/v1/destinatarios-directos")
@Tag(name = "Destinatarios Directos", description = "Endpoints para gestión de destinatarios directos")
@CrossOrigin(origins = "*")
public class DestinatarioDirectoController {

    private final DestinatarioDirectoService destinatarioDirectoService;

    public DestinatarioDirectoController(DestinatarioDirectoService destinatarioDirectoService) {
        this.destinatarioDirectoService = destinatarioDirectoService;
    }

    @GetMapping
    @Operation(summary = "Listar destinatarios directos", description = "Lista paginada con filtros opcionales: search (nombre, teléfono, dirección, código), activo.")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESTINATARIOS_DIRECTOS_LISTAR + "') or hasAuthority('" + PermissionConstants.DESTINATARIOS_DIRECTOS_VER + "')")
    public ResponseEntity<Page<DestinatarioDirectoDTO>> findAll(
            Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean activo) {
        return ResponseEntity.ok(destinatarioDirectoService.findAllPaginado(pageable, search, activo));
    }

    @GetMapping("/all")
    @Operation(summary = "Listar todos los destinatarios directos activos (sin paginación)", description = "Útil para llenar selects/autocompletes.")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESTINATARIOS_DIRECTOS_LISTAR + "') or hasAuthority('" + PermissionConstants.DESTINATARIOS_DIRECTOS_VER + "')")
    public ResponseEntity<List<DestinatarioDirectoDTO>> findAllNoPaginado() {
        return ResponseEntity.ok(destinatarioDirectoService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener destinatario directo por ID", description = "Obtiene los detalles de un destinatario directo específico")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESTINATARIOS_DIRECTOS_VER + "')")
    public ResponseEntity<DestinatarioDirectoDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(destinatarioDirectoService.findById(id));
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar destinatarios directos", description = "Busca destinatarios directos por nombre o teléfono")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESTINATARIOS_DIRECTOS_VER + "')")
    public ResponseEntity<List<DestinatarioDirectoDTO>> search(@RequestParam String query) {
        return ResponseEntity.ok(destinatarioDirectoService.search(query));
    }

    @PostMapping
    @Operation(summary = "Crear destinatario directo", description = "Crea un nuevo destinatario directo")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESTINATARIOS_DIRECTOS_CREAR + "')")
    public ResponseEntity<DestinatarioDirectoDTO> create(@Valid @RequestBody DestinatarioDirectoDTO dto) {
        return new ResponseEntity<>(destinatarioDirectoService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar destinatario directo", description = "Actualiza la información de un destinatario directo existente")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESTINATARIOS_DIRECTOS_EDITAR + "')")
    public ResponseEntity<DestinatarioDirectoDTO> update(@PathVariable Long id,
            @Valid @RequestBody DestinatarioDirectoDTO dto) {
        return ResponseEntity.ok(destinatarioDirectoService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar destinatario directo", description = "Elimina un destinatario directo (soft delete)")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESTINATARIOS_DIRECTOS_ELIMINAR + "')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        destinatarioDirectoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
