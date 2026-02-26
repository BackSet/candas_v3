package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.ManifiestoConsolidadoDTO;
import com.candas.candas_backend.dto.ManifiestoConsolidadoDetalleDTO;
import com.candas.candas_backend.dto.ManifiestoConsolidadoResumenDTO;
import com.candas.candas_backend.service.ManifiestoConsolidadoService;
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
@RequestMapping("/api/v1/manifiestos-consolidados")
@Tag(name = "Manifiestos Consolidados", description = "Endpoints para gestión de manifiestos consolidados")
@CrossOrigin(origins = "*")
public class ManifiestoConsolidadoController {

    private final ManifiestoConsolidadoService manifiestoConsolidadoService;

    public ManifiestoConsolidadoController(ManifiestoConsolidadoService manifiestoConsolidadoService) {
        this.manifiestoConsolidadoService = manifiestoConsolidadoService;
    }

    @GetMapping
    @Operation(summary = "Listar manifiestos consolidados", description = "Obtiene una lista paginada. Parámetros opcionales: search, numeroManifiesto, idAgencia, mes, anio.")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.MANIFIESTOS_CONSOLIDADOS_LISTAR + "') or hasAuthority('" + PermissionConstants.MANIFIESTOS_CONSOLIDADOS_VER + "')")
    public ResponseEntity<Page<ManifiestoConsolidadoResumenDTO>> findAll(
            Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String numeroManifiesto,
            @RequestParam(required = false) Long idAgencia,
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer anio) {
        return ResponseEntity.ok(manifiestoConsolidadoService.findAll(pageable, search, numeroManifiesto, idAgencia, mes, anio));
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar manifiestos consolidados")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.MANIFIESTOS_CONSOLIDADOS_VER + "')")
    public ResponseEntity<List<ManifiestoConsolidadoResumenDTO>> search(@RequestParam String query) {
        return ResponseEntity.ok(manifiestoConsolidadoService.search(query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener manifiesto consolidado por ID")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.MANIFIESTOS_CONSOLIDADOS_VER + "')")
    public ResponseEntity<ManifiestoConsolidadoDetalleDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(manifiestoConsolidadoService.findById(id));
    }

    @GetMapping("/agencia/{idAgencia}")
    @Operation(summary = "Listar manifiestos consolidados por agencia")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.MANIFIESTOS_CONSOLIDADOS_VER + "')")
    public ResponseEntity<Page<ManifiestoConsolidadoResumenDTO>> findByAgencia(
            @PathVariable Long idAgencia,
            Pageable pageable) {
        return ResponseEntity.ok(manifiestoConsolidadoService.findByAgencia(idAgencia, pageable));
    }

    @PostMapping
    @Operation(summary = "Crear manifiesto consolidado")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.MANIFIESTOS_CONSOLIDADOS_GENERAR + "')")
    public ResponseEntity<ManifiestoConsolidadoResumenDTO> create(@Valid @RequestBody ManifiestoConsolidadoDTO dto) {
        return new ResponseEntity<>(manifiestoConsolidadoService.crearManifiestoConsolidado(dto), HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar manifiesto consolidado")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.MANIFIESTOS_CONSOLIDADOS_ELIMINAR + "')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        manifiestoConsolidadoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
