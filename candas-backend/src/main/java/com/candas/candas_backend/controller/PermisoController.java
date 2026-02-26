package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.PermisoDTO;
import com.candas.candas_backend.service.PermisoService;
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
@RequestMapping("/api/v1/permisos")
@Tag(name = "Permisos", description = "Endpoints para gestión de permisos")
@CrossOrigin(origins = "*")
public class PermisoController {

    private final PermisoService permisoService;

    public PermisoController(PermisoService permisoService) {
        this.permisoService = permisoService;
    }

    @GetMapping
    @Operation(summary = "Listar permisos")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PERMISOS_LISTAR + "') or hasAuthority('" + PermissionConstants.PERMISOS_VER + "')")
    public ResponseEntity<Page<PermisoDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(permisoService.findAll(pageable));
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar permisos")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PERMISOS_VER + "')")
    public ResponseEntity<List<PermisoDTO>> search(@RequestParam String query) {
        return ResponseEntity.ok(permisoService.search(query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener permiso por ID")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PERMISOS_VER + "')")
    public ResponseEntity<PermisoDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(permisoService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear permiso")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PERMISOS_CREAR + "')")
    public ResponseEntity<PermisoDTO> create(@Valid @RequestBody PermisoDTO dto) {
        return new ResponseEntity<>(permisoService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar permiso")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PERMISOS_EDITAR + "')")
    public ResponseEntity<PermisoDTO> update(@PathVariable Long id, @Valid @RequestBody PermisoDTO dto) {
        return ResponseEntity.ok(permisoService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar permiso")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PERMISOS_ELIMINAR + "')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        permisoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
