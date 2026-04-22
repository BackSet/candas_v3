package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.PuntoOrigenDTO;
import com.candas.candas_backend.service.PuntoOrigenService;
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
@RequestMapping("/api/v1/puntos-origen")
@Tag(name = "Puntos de Origen", description = "Endpoints para gestión de puntos de origen")
@CrossOrigin(origins = "*")
public class PuntoOrigenController {

    private final PuntoOrigenService puntoOrigenService;

    public PuntoOrigenController(PuntoOrigenService puntoOrigenService) {
        this.puntoOrigenService = puntoOrigenService;
    }

    @GetMapping
    @Operation(summary = "Listar puntos de origen", description = "Lista paginada con filtros opcionales: search, activo.")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PUNTOS_ORIGEN_LISTAR + "') or hasAuthority('" + PermissionConstants.PUNTOS_ORIGEN_VER + "')")
    public ResponseEntity<Page<PuntoOrigenDTO>> findAll(
            Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean activo) {
        return ResponseEntity.ok(puntoOrigenService.findAll(pageable, search, activo));
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar puntos de origen")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PUNTOS_ORIGEN_VER + "')")
    public ResponseEntity<List<PuntoOrigenDTO>> search(@RequestParam String query) {
        return ResponseEntity.ok(puntoOrigenService.search(query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener punto de origen por ID")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PUNTOS_ORIGEN_VER + "')")
    public ResponseEntity<PuntoOrigenDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(puntoOrigenService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear punto de origen")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PUNTOS_ORIGEN_CREAR + "')")
    public ResponseEntity<PuntoOrigenDTO> create(@Valid @RequestBody PuntoOrigenDTO dto) {
        return new ResponseEntity<>(puntoOrigenService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar punto de origen")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PUNTOS_ORIGEN_EDITAR + "')")
    public ResponseEntity<PuntoOrigenDTO> update(@PathVariable Long id, @Valid @RequestBody PuntoOrigenDTO dto) {
        return ResponseEntity.ok(puntoOrigenService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar punto de origen")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PUNTOS_ORIGEN_ELIMINAR + "')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        puntoOrigenService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
