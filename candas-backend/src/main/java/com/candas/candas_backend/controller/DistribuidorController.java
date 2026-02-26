package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.DistribuidorDTO;
import com.candas.candas_backend.service.DistribuidorService;
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
@RequestMapping("/api/v1/distribuidores")
@Tag(name = "Distribuidores", description = "Endpoints para gestión de distribuidores")
@CrossOrigin(origins = "*")
public class DistribuidorController {

    private final DistribuidorService distribuidorService;

    public DistribuidorController(DistribuidorService distribuidorService) {
        this.distribuidorService = distribuidorService;
    }

    @GetMapping
    @Operation(summary = "Listar distribuidores", description = "Obtiene una lista paginada de todos los distribuidores")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DISTRIBUIDORES_LISTAR + "') or hasAuthority('" + PermissionConstants.DISTRIBUIDORES_VER + "')")
    public ResponseEntity<Page<DistribuidorDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(distribuidorService.findAll(pageable));
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar distribuidores")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DISTRIBUIDORES_VER + "')")
    public ResponseEntity<List<DistribuidorDTO>> search(@RequestParam String query) {
        return ResponseEntity.ok(distribuidorService.search(query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener distribuidor por ID")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DISTRIBUIDORES_VER + "')")
    public ResponseEntity<DistribuidorDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(distribuidorService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear distribuidor")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DISTRIBUIDORES_CREAR + "')")
    public ResponseEntity<DistribuidorDTO> create(@Valid @RequestBody DistribuidorDTO dto) {
        return new ResponseEntity<>(distribuidorService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar distribuidor")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DISTRIBUIDORES_EDITAR + "')")
    public ResponseEntity<DistribuidorDTO> update(@PathVariable Long id, @Valid @RequestBody DistribuidorDTO dto) {
        return ResponseEntity.ok(distribuidorService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar distribuidor")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DISTRIBUIDORES_ELIMINAR + "')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        distribuidorService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/buscar-o-crear")
    @Operation(summary = "Buscar o crear distribuidor", description = "Busca un distribuidor por nombre o código, o lo crea si no existe")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DISTRIBUIDORES_CREAR + "')")
    public ResponseEntity<DistribuidorDTO> buscarOCrear(
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String codigo) {
        return ResponseEntity.ok(distribuidorService.buscarOCrear(nombre, codigo));
    }
}
