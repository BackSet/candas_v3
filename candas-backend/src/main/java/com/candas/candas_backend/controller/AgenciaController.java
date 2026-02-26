package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.AgenciaDTO;
import com.candas.candas_backend.service.AgenciaService;
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
@RequestMapping("/api/v1/agencias")
@Tag(name = "Agencias", description = "Endpoints para gestión de agencias")
@CrossOrigin(origins = "*")
public class AgenciaController {

    private final AgenciaService agenciaService;

    public AgenciaController(AgenciaService agenciaService) {
        this.agenciaService = agenciaService;
    }

    @GetMapping
    @Operation(summary = "Listar agencias", description = "Obtiene una lista paginada de todas las agencias. Parámetros opcionales: search (texto en nombre/código/email/cantón), nombre, codigo, activa.")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.AGENCIAS_LISTAR + "') or hasAuthority('" + PermissionConstants.AGENCIAS_VER + "')")
    public ResponseEntity<Page<AgenciaDTO>> findAll(
            Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String codigo,
            @RequestParam(required = false) Boolean activa) {
        return ResponseEntity.ok(agenciaService.findAll(pageable, search, nombre, codigo, activa));
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar agencias")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.AGENCIAS_VER + "')")
    public ResponseEntity<List<AgenciaDTO>> search(@RequestParam String query) {
        return ResponseEntity.ok(agenciaService.search(query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener agencia por ID")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.AGENCIAS_VER + "')")
    public ResponseEntity<AgenciaDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(agenciaService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear agencia")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.AGENCIAS_CREAR + "')")
    public ResponseEntity<AgenciaDTO> create(@Valid @RequestBody AgenciaDTO dto) {
        return new ResponseEntity<>(agenciaService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar agencia")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.AGENCIAS_EDITAR + "')")
    public ResponseEntity<AgenciaDTO> update(@PathVariable Long id, @Valid @RequestBody AgenciaDTO dto) {
        return ResponseEntity.ok(agenciaService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar agencia")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.AGENCIAS_ELIMINAR + "')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        agenciaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
