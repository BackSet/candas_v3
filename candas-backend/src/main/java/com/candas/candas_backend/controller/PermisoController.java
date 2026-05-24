package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.PermisoDTO;
import com.candas.candas_backend.dto.PermisoNombreUpdateDTO;
import com.candas.candas_backend.service.PermisoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.candas.candas_backend.util.PermissionConstants;

@RestController
@RequestMapping("/api/v1/permisos")
@Tag(name = "Permisos", description = "Consulta y renombrado de permisos (alta/baja solo desde código)")
@CrossOrigin(origins = "*")
public class PermisoController {

    private final PermisoService permisoService;

    public PermisoController(PermisoService permisoService) {
        this.permisoService = permisoService;
    }

    @GetMapping
    @Operation(summary = "Listar permisos", description = "Lista paginada con filtros opcionales: search, recurso, accion.")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PERMISOS_LISTAR + "') or hasAuthority('" + PermissionConstants.PERMISOS_VER + "')")
    public ResponseEntity<Page<PermisoDTO>> findAll(
            Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String recurso,
            @RequestParam(required = false) String accion) {
        return ResponseEntity.ok(permisoService.findAll(pageable, search, recurso, accion));
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

    @PutMapping("/{id}")
    @Operation(summary = "Renombrar permiso", description = "Solo actualiza el nombre. Recurso/acción se definen en código.")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PERMISOS_EDITAR + "')")
    public ResponseEntity<PermisoDTO> updateNombre(
            @PathVariable Long id,
            @Valid @RequestBody PermisoNombreUpdateDTO dto) {
        return ResponseEntity.ok(permisoService.updateNombre(id, dto.nombre()));
    }
}
