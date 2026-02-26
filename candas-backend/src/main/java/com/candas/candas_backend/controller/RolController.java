package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.RolDTO;
import com.candas.candas_backend.service.RolService;
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
import java.util.Map;

@RestController
@RequestMapping("/api/v1/roles")
@Tag(name = "Roles", description = "Endpoints para gestión de roles")
@CrossOrigin(origins = "*")
public class RolController {

    private final RolService rolService;

    public RolController(RolService rolService) {
        this.rolService = rolService;
    }

    @GetMapping
    @Operation(summary = "Listar roles")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.ROLES_LISTAR + "') or hasAuthority('" + PermissionConstants.ROLES_VER + "')")
    public ResponseEntity<Page<RolDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(rolService.findAll(pageable));
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar roles")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.ROLES_VER + "')")
    public ResponseEntity<List<RolDTO>> search(@RequestParam String query) {
        return ResponseEntity.ok(rolService.search(query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener rol por ID")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.ROLES_VER + "')")
    public ResponseEntity<RolDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(rolService.findById(id));
    }

    @GetMapping("/{id}/permisos")
    @Operation(summary = "Obtener permisos de un rol")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.ROLES_VER + "')")
    public ResponseEntity<List<Long>> obtenerPermisos(@PathVariable Long id) {
        return ResponseEntity.ok(rolService.obtenerPermisos(id));
    }

    @PostMapping
    @Operation(summary = "Crear rol")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.ROLES_CREAR + "')")
    public ResponseEntity<RolDTO> create(@Valid @RequestBody RolDTO dto) {
        return new ResponseEntity<>(rolService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar rol")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.ROLES_EDITAR + "')")
    public ResponseEntity<RolDTO> update(@PathVariable Long id, @Valid @RequestBody RolDTO dto) {
        return ResponseEntity.ok(rolService.update(id, dto));
    }

    @PutMapping("/{id}/permisos")
    @Operation(summary = "Asignar permisos a rol")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.ROLES_ASIGNAR_PERMISOS + "')")
    public ResponseEntity<Void> asignarPermisos(@PathVariable Long id, @RequestBody Map<String, List<Long>> request) {
        rolService.asignarPermisos(id, request.get("permisos"));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar rol")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.ROLES_ELIMINAR + "')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        rolService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
