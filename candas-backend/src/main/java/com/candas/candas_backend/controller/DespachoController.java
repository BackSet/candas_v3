package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.AgregarCadenitaDespachoDTO;
import com.candas.candas_backend.dto.DespachoDTO;
import com.candas.candas_backend.dto.SacaDTO;
import com.candas.candas_backend.service.DespachoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.candas.candas_backend.util.PermissionConstants;

@RestController
@RequestMapping("/api/v1/despachos")
@Tag(name = "Despachos", description = "Endpoints para gestión de despachos")
@CrossOrigin(origins = "*")
public class DespachoController {

    private final DespachoService despachoService;

    public DespachoController(DespachoService despachoService) {
        this.despachoService = despachoService;
    }

    @GetMapping
    @Operation(summary = "Listar despachos")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_LISTAR + "') or hasAuthority('" + PermissionConstants.DESPACHOS_VER + "')")
    public ResponseEntity<Page<DespachoDTO>> findAll(
            Pageable pageable,
            @RequestParam(required = false) String tipoDestino,
            @RequestParam(required = false) String fechaDesde,
            @RequestParam(required = false) String fechaHasta,
            @RequestParam(required = false) String search) {
        LocalDate desde = parseFecha(fechaDesde);
        LocalDate hasta = parseFecha(fechaHasta);
        return ResponseEntity.ok(despachoService.findAll(pageable, tipoDestino, desde, hasta, search));
    }

    private static LocalDate parseFecha(String fecha) {
        if (fecha == null || fecha.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(fecha.trim());
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar despachos")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_VER + "')")
    public ResponseEntity<List<DespachoDTO>> search(@RequestParam String query) {
        return ResponseEntity.ok(despachoService.search(query));
    }

    @GetMapping("/por-periodo")
    @Operation(summary = "Listar despachos por período de fechas")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_LISTAR + "') or hasAuthority('" + PermissionConstants.DESPACHOS_VER + "')")
    public ResponseEntity<List<DespachoDTO>> findByPeriodo(
            @RequestParam String fechaDesde,
            @RequestParam String fechaHasta) {
        if (fechaDesde == null || fechaDesde.isBlank() || fechaHasta == null || fechaHasta.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        LocalDate desde = LocalDate.parse(fechaDesde);
        LocalDate hasta = LocalDate.parse(fechaHasta);
        if (hasta.isBefore(desde)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(despachoService.findByPeriodo(desde, hasta));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener despacho por ID")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_VER + "')")
    public ResponseEntity<DespachoDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(despachoService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear despacho")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_CREAR + "')")
    public ResponseEntity<DespachoDTO> create(@Valid @RequestBody DespachoDTO dto) {
        return new ResponseEntity<>(despachoService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar despacho")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_EDITAR + "')")
    public ResponseEntity<DespachoDTO> update(@PathVariable Long id, @Valid @RequestBody DespachoDTO dto) {
        return ResponseEntity.ok(despachoService.update(id, dto));
    }

    @PostMapping("/{id}/sacas")
    @Operation(summary = "Agregar sacas a despacho")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_EDITAR + "')")
    public ResponseEntity<Void> agregarSacas(@PathVariable Long id,
            @RequestBody java.util.Map<String, java.util.List<Long>> request) {
        despachoService.agregarSacas(id, request.get("idSacas"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/agregar-cadenita")
    @Operation(summary = "Agregar Cadenita al despacho", description = "Crea una saca en el despacho con todas las guías hijas (tipo CADENITA) asociadas a la guía padre indicada")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_EDITAR + "')")
    public ResponseEntity<SacaDTO> agregarCadenita(@PathVariable Long id,
            @Valid @RequestBody AgregarCadenitaDespachoDTO dto) {
        SacaDTO saca = despachoService.agregarCadenitaAlDespacho(id, dto.getNumeroGuiaPadre());
        return ResponseEntity.ok(saca);
    }

    @GetMapping("/{id}/sacas")
    @Operation(summary = "Obtener sacas de un despacho")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_VER + "')")
    public ResponseEntity<java.util.List<com.candas.candas_backend.dto.SacaDTO>> obtenerSacas(@PathVariable Long id) {
        return ResponseEntity.ok(despachoService.obtenerSacas(id));
    }

    @PostMapping("/acciones/marcar-despachado")
    @Operation(summary = "Marcar paquetes de varios despachos como despachados (batch)")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_EDITAR + "')")
    public ResponseEntity<Map<String, Object>> marcarComoDespachadoBatch(
            @RequestBody Map<String, List<Long>> request) {
        List<Long> ids = request != null ? request.get("ids") : null;
        int paquetesMarcados = despachoService.marcarPaquetesComoDespachadosBatch(ids);
        Map<String, Object> response = new HashMap<>();
        response.put("paquetesMarcados", paquetesMarcados);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/marcar-despachado")
    @Operation(summary = "Marcar paquetes del despacho como despachados")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_EDITAR + "')")
    public ResponseEntity<Map<String, Object>> marcarComoDespachado(@PathVariable Long id) {
        int paquetesMarcados = despachoService.marcarPaquetesComoDespachados(id);
        Map<String, Object> response = new HashMap<>();
        response.put("paquetesMarcados", paquetesMarcados);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar despacho")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_ELIMINAR + "')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        despachoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
