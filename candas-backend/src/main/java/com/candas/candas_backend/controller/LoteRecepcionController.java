package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.*;
import com.candas.candas_backend.service.ListasEtiquetadasService;
import com.candas.candas_backend.service.LoteRecepcionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import com.candas.candas_backend.entity.enums.TipoLote;
import com.candas.candas_backend.util.PermissionConstants;

@RestController
@RequestMapping("/api/v1/lotes-recepcion")
@Tag(name = "Lotes de Recepción", description = "Endpoints para gestión de lotes de recepción")
@CrossOrigin(origins = "*")
public class LoteRecepcionController {

    private final LoteRecepcionService loteRecepcionService;
    private final ListasEtiquetadasService listasEtiquetadasService;

    public LoteRecepcionController(LoteRecepcionService loteRecepcionService,
                                  ListasEtiquetadasService listasEtiquetadasService) {
        this.loteRecepcionService = loteRecepcionService;
        this.listasEtiquetadasService = listasEtiquetadasService;
    }

    @GetMapping
    @Operation(summary = "Listar lotes de recepción",
            description = "Lista paginada con filtros opcionales: tipoLote=NORMAL|ESPECIAL, search (número recepción o usuario), idAgencia, fechaDesde/fechaHasta (yyyy-MM-dd).")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_LISTAR + "') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_VER + "')")
    public ResponseEntity<Page<LoteRecepcionDTO>> findAll(
            Pageable pageable,
            @RequestParam(required = false) String tipoLote,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long idAgencia,
            @RequestParam(required = false) String fechaDesde,
            @RequestParam(required = false) String fechaHasta) {
        TipoLote t = parseTipoLote(tipoLote);
        java.time.LocalDateTime desde = parseFechaInicio(fechaDesde);
        java.time.LocalDateTime hasta = parseFechaFin(fechaHasta);
        boolean tieneFiltros = (search != null && !search.isBlank()) || t != null || idAgencia != null
                || desde != null || hasta != null;
        if (tieneFiltros) {
            return ResponseEntity.ok(loteRecepcionService.findAll(pageable, search, t, idAgencia, desde, hasta));
        }
        return ResponseEntity.ok(loteRecepcionService.findAll(pageable));
    }

    private static java.time.LocalDateTime parseFechaInicio(String fecha) {
        if (fecha == null || fecha.isBlank()) return null;
        try {
            return java.time.LocalDate.parse(fecha.trim()).atStartOfDay();
        } catch (java.time.format.DateTimeParseException e) {
            return null;
        }
    }

    private static java.time.LocalDateTime parseFechaFin(String fecha) {
        if (fecha == null || fecha.isBlank()) return null;
        try {
            return java.time.LocalDate.parse(fecha.trim()).atTime(23, 59, 59);
        } catch (java.time.format.DateTimeParseException e) {
            return null;
        }
    }

    private static TipoLote parseTipoLote(String tipoLote) {
        if (tipoLote == null || tipoLote.isBlank()) return null;
        if ("ESPECIAL".equalsIgnoreCase(tipoLote.trim())) return TipoLote.ESPECIAL;
        if ("NORMAL".equalsIgnoreCase(tipoLote.trim())) return TipoLote.NORMAL;
        return null;
    }

    @GetMapping("/especiales")
    @Operation(summary = "Listar lotes especiales", description = "Lista paginada de lotes con tipo ESPECIAL")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_LISTAR + "') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_VER + "')")
    public ResponseEntity<Page<LoteRecepcionDTO>> findAllEspeciales(Pageable pageable) {
        return ResponseEntity.ok(loteRecepcionService.findAllByTipoLote(TipoLote.ESPECIAL, pageable));
    }

    @GetMapping("/especiales/search")
    @Operation(summary = "Buscar lotes especiales")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_VER + "')")
    public ResponseEntity<List<LoteRecepcionDTO>> searchEspeciales(@RequestParam String query) {
        return ResponseEntity.ok(loteRecepcionService.searchByTipoLote(query, TipoLote.ESPECIAL));
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar lotes de recepción")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_VER + "')")
    public ResponseEntity<List<LoteRecepcionDTO>> search(@RequestParam String query) {
        return ResponseEntity.ok(loteRecepcionService.search(query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener lote de recepción por ID")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_VER + "')")
    public ResponseEntity<LoteRecepcionDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(loteRecepcionService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear lote de recepción")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_CREAR + "')")
    public ResponseEntity<LoteRecepcionDTO> create(@Valid @RequestBody LoteRecepcionDTO dto) {
        return new ResponseEntity<>(loteRecepcionService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar lote de recepción")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_EDITAR + "')")
    public ResponseEntity<LoteRecepcionDTO> update(@PathVariable Long id, @Valid @RequestBody LoteRecepcionDTO dto) {
        return ResponseEntity.ok(loteRecepcionService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar lote de recepción")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_ELIMINAR + "')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        loteRecepcionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/paquetes")
    @Operation(summary = "Agregar paquetes al lote de recepción")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_EDITAR + "')")
    public ResponseEntity<Void> agregarPaquetes(
            @PathVariable Long id,
            @RequestBody Map<String, List<Long>> request) {
        List<Long> idPaquetes = request.get("idPaquetes");
        loteRecepcionService.agregarPaquetes(id, idPaquetes);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/paquetes")
    @Operation(summary = "Obtener paquetes del lote de recepción")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_VER + "')")
    public ResponseEntity<List<PaqueteDTO>> obtenerPaquetes(@PathVariable Long id) {
        return ResponseEntity.ok(loteRecepcionService.obtenerPaquetes(id));
    }

    @PostMapping("/{id}/importar-excel")
    @Operation(summary = "Importar paquetes desde Excel", description = "Importa paquetes al lote de recepción desde un archivo Excel")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_EDITAR + "')")
    public ResponseEntity<LoteRecepcionImportResultDTO> importarPaquetesDesdeExcel(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(loteRecepcionService.importarPaquetesDesdeExcel(id, file));
    }

    @PostMapping("/{id}/agregar-paquetes")
    @Operation(summary = "Agregar paquetes por número de guía", description = "Agrega paquetes al lote de recepción usando números de guía")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_EDITAR + "')")
    public ResponseEntity<LoteRecepcionImportResultDTO> agregarPaquetesPorNumeroGuia(
            @PathVariable Long id,
            @RequestBody Map<String, List<String>> request) {
        List<String> numerosGuia = request.get("numerosGuia");
        return ResponseEntity.ok(loteRecepcionService.agregarPaquetesPorNumeroGuia(id, numerosGuia));
    }

    @PostMapping("/{id}/listas-especiales")
    @Operation(summary = "Agregar listas de paquetes a lote especial", description = "Crea/actualiza paquetes con la etiqueta indicada y los asocia al lote especial (RECIBIDO)")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_EDITAR + "')")
    public ResponseEntity<ListasEtiquetadasBatchResultDTO> agregarListasEspeciales(
            @PathVariable Long id,
            @Valid @RequestBody ListasEtiquetadasBatchRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(listasEtiquetadasService.addListasEspecialesALote(id, request));
    }

    @GetMapping("/{id}/estadisticas")
    @Operation(summary = "Obtener estadísticas del lote de recepción")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_VER + "')")
    public ResponseEntity<LoteRecepcionEstadisticasDTO> obtenerEstadisticas(@PathVariable Long id) {
        return ResponseEntity.ok(loteRecepcionService.obtenerEstadisticas(id));
    }

    @GetMapping("/{id}/paquetes-no-encontrados")
    @Operation(summary = "Obtener paquetes no encontrados del lote de recepción")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_VER + "')")
    public ResponseEntity<List<PaqueteNoEncontradoDTO>> obtenerPaquetesNoEncontrados(@PathVariable Long id) {
        return ResponseEntity.ok(loteRecepcionService.obtenerPaquetesNoEncontrados(id));
    }

    @PostMapping("/{id}/agregar-hijos-clementina")
    @Operation(summary = "Agregar hijos CLEMENTINA al lote", description = "Asigna paquetes hijos a un paquete padre CLEMENTINA y los agrega al lote de recepción")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_EDITAR + "')")
    public ResponseEntity<LoteRecepcionImportResultDTO> agregarHijosClementina(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        Long idPaquetePadre = Long.valueOf(request.get("idPaquetePadre").toString());
        List<Long> idPaquetesHijos = ((List<?>) request.get("idPaquetesHijos")).stream()
                .map(obj -> Long.valueOf(obj.toString()))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(loteRecepcionService.agregarHijosClementinaALote(id, idPaquetePadre, idPaquetesHijos));
    }

    @PostMapping("/{id}/agregar-hijo-clementina-por-guia")
    @Operation(summary = "Agregar hijo CLEMENTINA por número de guía al lote", description = "Asigna un paquete hijo por número de guía a un paquete padre CLEMENTINA y lo agrega al lote de recepción")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.LOTES_RECEPCION_EDITAR + "')")
    public ResponseEntity<LoteRecepcionImportResultDTO> agregarHijoClementinaPorGuia(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        Long idPaquetePadre = Long.valueOf(request.get("idPaquetePadre").toString());
        String numeroGuia = request.get("numeroGuia").toString();
        return ResponseEntity
                .ok(loteRecepcionService.agregarHijoClementinaPorGuiaALote(id, idPaquetePadre, numeroGuia));
    }
}
