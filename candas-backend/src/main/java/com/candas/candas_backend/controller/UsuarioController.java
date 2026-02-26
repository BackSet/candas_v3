package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.UsuarioDTO;
import com.candas.candas_backend.service.UsuarioService;
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
@RequestMapping("/api/v1/usuarios")
@Tag(name = "Usuarios", description = "Endpoints para gestión de usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    @Operation(summary = "Listar usuarios")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.USUARIOS_LISTAR + "') or hasAuthority('" + PermissionConstants.USUARIOS_VER + "')")
    public ResponseEntity<Page<UsuarioDTO>> findAll(
            Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Boolean activo) {
        return ResponseEntity.ok(usuarioService.findAll(pageable, search, username, email, activo));
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar usuarios")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.USUARIOS_VER + "')")
    public ResponseEntity<List<UsuarioDTO>> search(@RequestParam String query) {
        return ResponseEntity.ok(usuarioService.search(query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener usuario por ID")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.USUARIOS_VER + "')")
    public ResponseEntity<UsuarioDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.findById(id));
    }

    @GetMapping("/{id}/roles")
    @Operation(summary = "Obtener roles de un usuario")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.USUARIOS_VER + "')")
    public ResponseEntity<List<Long>> obtenerRoles(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.obtenerRoles(id));
    }

    @PostMapping
    @Operation(summary = "Crear usuario")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.USUARIOS_CREAR + "')")
    public ResponseEntity<UsuarioDTO> create(@Valid @RequestBody UsuarioDTO dto) {
        return new ResponseEntity<>(usuarioService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar usuario")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.USUARIOS_EDITAR + "')")
    public ResponseEntity<UsuarioDTO> update(@PathVariable Long id, @Valid @RequestBody UsuarioDTO dto) {
        return ResponseEntity.ok(usuarioService.update(id, dto));
    }

    @PutMapping("/{id}/roles")
    @Operation(summary = "Asignar roles a usuario")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.USUARIOS_ASIGNAR_ROLES + "')")
    public ResponseEntity<Void> asignarRoles(@PathVariable Long id, @RequestBody Map<String, List<Long>> request) {
        usuarioService.asignarRoles(id, request.get("roles"));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar usuario")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.USUARIOS_ELIMINAR + "')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        usuarioService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
