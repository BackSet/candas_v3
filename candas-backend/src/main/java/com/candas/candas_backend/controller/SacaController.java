package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.SacaDTO;
import com.candas.candas_backend.service.SacaService;
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
@RequestMapping("/api/v1/sacas")
@Tag(name = "Sacas", description = "Endpoints para gestión de sacas")
@CrossOrigin(origins = "*")
public class SacaController {

    private final SacaService sacaService;

    public SacaController(SacaService sacaService) {
        this.sacaService = sacaService;
    }

    @GetMapping
    @Operation(summary = "Listar sacas")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.SACAS_LISTAR + "') or hasAuthority('" + PermissionConstants.SACAS_VER + "')")
    public ResponseEntity<Page<SacaDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(sacaService.findAll(pageable));
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar sacas")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.SACAS_VER + "')")
    public ResponseEntity<List<SacaDTO>> search(@RequestParam String query) {
        return ResponseEntity.ok(sacaService.search(query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener saca por ID")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.SACAS_VER + "')")
    public ResponseEntity<SacaDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(sacaService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear saca")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.SACAS_CREAR + "')")
    public ResponseEntity<SacaDTO> create(@Valid @RequestBody SacaDTO dto) {
        return new ResponseEntity<>(sacaService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar saca")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.SACAS_EDITAR + "')")
    public ResponseEntity<SacaDTO> update(@PathVariable Long id, @Valid @RequestBody SacaDTO dto) {
        return ResponseEntity.ok(sacaService.update(id, dto));
    }

    @PostMapping("/{id}/paquetes")
    @Operation(summary = "Agregar paquetes a saca")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.SACAS_EDITAR + "')")
    public ResponseEntity<Void> agregarPaquetes(@PathVariable Long id,
            @RequestBody java.util.Map<String, java.util.List<Long>> request) {
        sacaService.agregarPaquetes(id, request.get("idPaquetes"));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/paquetes")
    @Operation(summary = "Obtener paquetes de una saca")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.SACAS_VER + "')")
    public ResponseEntity<java.util.List<com.candas.candas_backend.dto.PaqueteDTO>> obtenerPaquetes(
            @PathVariable Long id) {
        return ResponseEntity.ok(sacaService.obtenerPaquetes(id));
    }

    @PutMapping("/{id}/calcular-peso")
    @Operation(summary = "Recalcular peso total de la saca")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.SACAS_EDITAR + "')")
    public ResponseEntity<SacaDTO> calcularPeso(@PathVariable Long id) {
        return ResponseEntity.ok(sacaService.calcularPesoTotal(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar saca")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.SACAS_ELIMINAR + "')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        sacaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
