package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.AsociarCadenitaLoteDTO;
import com.candas.candas_backend.dto.AsociarCadenitaLoteResultDTO;
import com.candas.candas_backend.dto.AsociarClementinaLoteDTO;
import com.candas.candas_backend.dto.AsociarClementinaLoteResultDTO;
import com.candas.candas_backend.dto.CambiarTipoMasivoDTO;
import com.candas.candas_backend.dto.ImportResultDTO;
import com.candas.candas_backend.dto.GuiaRefDTO;
import com.candas.candas_backend.dto.PaqueteDTO;
import com.candas.candas_backend.dto.PaqueteEstadisticasDTO;
import com.candas.candas_backend.dto.PaqueteRapidoDTO;
import com.candas.candas_backend.dto.PaqueteSimplificadoDTO;
import com.candas.candas_backend.entity.enums.EstadoPaquete;
import com.candas.candas_backend.entity.enums.TipoPaquete;
import com.candas.candas_backend.service.PaqueteHierarchyService;
import com.candas.candas_backend.service.PaqueteImportService;
import com.candas.candas_backend.service.PaqueteService;
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
import com.candas.candas_backend.util.PermissionConstants;

@RestController
@RequestMapping("/api/v1/paquetes")
@Tag(name = "Paquetes", description = "Endpoints para gestión de paquetes")
@CrossOrigin(origins = "*")
public class PaqueteController {

    private final PaqueteService paqueteService;
    private final PaqueteHierarchyService paqueteHierarchyService;
    private final PaqueteImportService paqueteImportService;

    public PaqueteController(
            PaqueteService paqueteService,
            PaqueteHierarchyService paqueteHierarchyService,
            PaqueteImportService paqueteImportService) {
        this.paqueteService = paqueteService;
        this.paqueteHierarchyService = paqueteHierarchyService;
        this.paqueteImportService = paqueteImportService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_LISTAR + "') or hasAuthority('" + PermissionConstants.PAQUETES_VER + "')")
    @Operation(summary = "Listar paquetes", description = "Lista paginada con filtros opcionales: search (guía o REF), estado, tipo, idAgencia (destino), idLote, fechaDesde/fechaHasta (yyyy-MM-dd).")
    public ResponseEntity<Page<PaqueteDTO>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) Long idAgencia,
            @RequestParam(required = false) Long idLote,
            @RequestParam(required = false) String fechaDesde,
            @RequestParam(required = false) String fechaHasta,
            Pageable pageable) {
        EstadoPaquete estadoEnum = parseEstado(estado);
        TipoPaquete tipoEnum = parseTipo(tipo);
        java.time.LocalDateTime desde = parseFechaInicio(fechaDesde);
        java.time.LocalDateTime hasta = parseFechaFin(fechaHasta);
        return ResponseEntity.ok(paqueteService.findAll(search, estadoEnum, tipoEnum, idAgencia, idLote, desde, hasta, pageable));
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

    private static EstadoPaquete parseEstado(String estado) {
        if (estado == null || estado.isBlank() || "all".equalsIgnoreCase(estado)) {
            return null;
        }
        try {
            return EstadoPaquete.valueOf(estado.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static TipoPaquete parseTipo(String tipo) {
        if (tipo == null || tipo.isBlank() || "all".equalsIgnoreCase(tipo)) {
            return null;
        }
        try {
            return TipoPaquete.valueOf(tipo.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_VER + "')")
    @Operation(summary = "Obtener paquete por ID")
    public ResponseEntity<PaqueteDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(paqueteService.findById(id));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_LISTAR + "')")
    @Operation(summary = "Estadísticas de paquetes", description = "Devuelve el total de paquetes y conteos por estado (REGISTRADO, RECIBIDO, ENSACADO, DESPACHADO)")
    public ResponseEntity<PaqueteEstadisticasDTO> getEstadisticas() {
        return ResponseEntity.ok(paqueteService.getEstadisticas());
    }

    @GetMapping("/por-guia/{numeroGuia}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_VER + "')")
    @Operation(summary = "Buscar paquete por número de guía")
    public ResponseEntity<PaqueteDTO> findByNumeroGuia(@PathVariable String numeroGuia) {
        return ResponseEntity.ok(paqueteService.findByNumeroGuia(numeroGuia));
    }

    @GetMapping("/{id}/hijos")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_VER + "')")
    @Operation(summary = "Obtener paquetes hijos", description = "Obtiene todos los paquetes hijos de un paquete padre")
    public ResponseEntity<List<PaqueteDTO>> findHijos(@PathVariable Long id) {
        return ResponseEntity.ok(paqueteHierarchyService.findHijos(id));
    }

    @GetMapping("/hijos-cadenita")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_VER + "')")
    @Operation(summary = "Obtener hijos CADENITA por guía padre", description = "Obtiene los paquetes hijos tipo CADENITA dado el número de guía del padre")
    public ResponseEntity<List<PaqueteDTO>> findHijosCadenita(@RequestParam String numeroGuiaPadre) {
        return ResponseEntity.ok(paqueteHierarchyService.findHijosCadenita(numeroGuiaPadre));
    }

    @PostMapping("/verificar-clementina-con-hijos")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_VER + "')")
    @Operation(summary = "Verificar CLEMENTINA con hijos (batch)", description = "Verifica qué paquetes CLEMENTINA de una lista tienen hijos asociados")
    public ResponseEntity<java.util.Set<Long>> verificarClementinaConHijos(
            @RequestBody Map<String, List<Long>> request) {
        List<Long> ids = request.get("ids");
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.ok(java.util.Collections.emptySet());
        }
        return ResponseEntity.ok(paqueteHierarchyService.verificarClementinaConHijos(ids));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_CREAR + "')")
    @Operation(summary = "Crear paquete")
    public ResponseEntity<PaqueteDTO> create(@Valid @RequestBody PaqueteDTO dto) {
        return new ResponseEntity<>(paqueteService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_EDITAR + "')")
    @Operation(summary = "Actualizar paquete")
    public ResponseEntity<PaqueteDTO> update(@PathVariable Long id, @RequestBody PaqueteDTO dto) {
        // No usar @Valid aquí para permitir actualizaciones parciales
        // Las validaciones de negocio se hacen en el servicio
        return ResponseEntity.ok(paqueteService.update(id, dto));
    }

    @PostMapping("/{id}/separar")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_EDITAR + "')")
    @Operation(summary = "Separar paquete", description = "Crea paquetes hijos a partir de un paquete padre tipo SEPARAR")
    public ResponseEntity<List<PaqueteDTO>> separarPaquete(@PathVariable Long id,
            @RequestBody List<PaqueteDTO> paquetesHijos) {
        return new ResponseEntity<>(paqueteHierarchyService.separarPaquete(id, paquetesHijos), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/asignar-hijos-clementina")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_EDITAR + "')")
    @Operation(summary = "Asignar hijos a paquete CLEMENTINA", description = "Asigna paquetes hijos existentes a un paquete padre tipo CLEMENTINA")
    public ResponseEntity<List<PaqueteDTO>> asignarHijosClementina(
            @PathVariable Long id,
            @RequestBody Map<String, List<Long>> request) {
        List<Long> idPaquetesHijos = request.get("idPaquetesHijos");
        return new ResponseEntity<>(paqueteHierarchyService.asignarHijosAClementina(id, idPaquetesHijos),
                HttpStatus.OK);
    }

    @PostMapping("/{id}/asignar-hijo-por-guia")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_EDITAR + "')")
    @Operation(summary = "Asignar hijo por número de guía a paquete CLEMENTINA", description = "Asigna un paquete hijo por número de guía a un paquete padre tipo CLEMENTINA")
    public ResponseEntity<PaqueteDTO> asignarHijoPorGuia(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String numeroGuia = request.get("numeroGuia");
        return new ResponseEntity<>(paqueteHierarchyService.asignarHijoPorNumeroGuia(id, numeroGuia), HttpStatus.OK);
    }

    @PostMapping("/asociar-clementina-lote")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_EDITAR + "')")
    @Operation(summary = "Asociar CLEMENTINA por lotes", description = "Asocia múltiples paquetes hijos a paquetes CLEMENTINA padres por lotes usando números de guía")
    public ResponseEntity<AsociarClementinaLoteResultDTO> asociarClementinaPorLote(
            @Valid @RequestBody AsociarClementinaLoteDTO dto) {
        return ResponseEntity.ok(paqueteHierarchyService.asociarClementinaPorLote(dto));
    }

    @PostMapping("/asociar-cadenita-lote")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_EDITAR + "')")
    @Operation(summary = "Asociar CADENITA por lote", description = "Asocia una lista de guías hijas a una guía padre, marcando cada hijo como tipo CADENITA")
    public ResponseEntity<AsociarCadenitaLoteResultDTO> asociarCadenitaPorLote(
            @Valid @RequestBody AsociarCadenitaLoteDTO dto) {
        return ResponseEntity.ok(paqueteHierarchyService.asociarCadenitaPorLote(dto));
    }

    @PutMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_EDITAR + "')")
    @Operation(summary = "Cambiar estado del paquete")
    public ResponseEntity<PaqueteDTO> cambiarEstado(@PathVariable Long id, @RequestBody EstadoPaquete nuevoEstado) {
        return ResponseEntity.ok(paqueteService.cambiarEstado(id, nuevoEstado));
    }

    @PostMapping("/{id}/marcar-etiqueta-cambiada")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_EDITAR + "')")
    @Operation(summary = "Marcar etiqueta cambiada", description = "Marca que un paquete CLEMENTINA ya ha sido cambiado de etiqueta")
    public ResponseEntity<PaqueteDTO> marcarEtiquetaCambiada(@PathVariable Long id) {
        return ResponseEntity.ok(paqueteService.marcarEtiquetaCambiada(id));
    }

    @PostMapping("/{id}/marcar-separado")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_EDITAR + "')")
    @Operation(summary = "Marcar como separado", description = "Marca que un paquete SEPARAR ya ha sido separado")
    public ResponseEntity<PaqueteDTO> marcarSeparado(@PathVariable Long id) {
        return ResponseEntity.ok(paqueteService.marcarSeparado(id));
    }

    @PostMapping("/{id}/marcar-unido-en-caja")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_EDITAR + "')")
    @Operation(summary = "Marcar como unido en caja", description = "Marca que un paquete CADENITA ya ha sido unido en una caja")
    public ResponseEntity<PaqueteDTO> marcarUnidoEnCaja(@PathVariable Long id) {
        return ResponseEntity.ok(paqueteService.marcarUnidoEnCaja(id));
    }

    @PutMapping("/cambiar-tipo-masivo")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_EDITAR + "')")
    @Operation(summary = "Cambiar tipo de paquete masivamente", description = "Cambia el tipo de múltiples paquetes a la vez")
    public ResponseEntity<List<PaqueteDTO>> cambiarTipoMasivo(@Valid @RequestBody CambiarTipoMasivoDTO dto) {
        return ResponseEntity.ok(paqueteService.cambiarTipoMasivo(dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_ELIMINAR + "')")
    @Operation(summary = "Eliminar paquete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        paqueteService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/importar")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_CREAR + "')")
    @Operation(summary = "Importar paquetes desde Excel", description = "Importa paquetes desde un archivo Excel con formato específico. El número master se lee de la primera fila del Excel.")
    public ResponseEntity<ImportResultDTO> importarDesdeExcel(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(paqueteImportService.importarDesdeExcel(file));
    }

    @PostMapping("/simplificado")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_CREAR + "')")
    @Operation(summary = "Crear paquete simplificado", description = "Crea un paquete con solo número de guía y observación. Si el número de guía ya existe, actualiza solo la observación.")
    public ResponseEntity<PaqueteDTO> createSimplificado(@Valid @RequestBody PaqueteSimplificadoDTO dto) {
        return new ResponseEntity<>(paqueteService.createSimplificado(dto), HttpStatus.CREATED);
    }

    @PostMapping("/rapido")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_CREAR + "')")
    @Operation(summary = "Crear paquete rápido (SEPARAR)", description = "Crea un paquete tipo SEPARAR con peso, descripción y destinatario")
    public ResponseEntity<PaqueteDTO> crearPaqueteRapido(@Valid @RequestBody PaqueteRapidoDTO dto) {
        return new ResponseEntity<>(paqueteService.crearPaqueteRapido(dto), HttpStatus.CREATED);
    }

    @PostMapping("/simplificado/batch")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_CREAR + "')")
    @Operation(summary = "Crear múltiples paquetes simplificados", description = "Crea múltiples paquetes con solo número de guía y observación. Si un número de guía ya existe, actualiza solo la observación.")
    public ResponseEntity<List<PaqueteDTO>> createSimplificadoBatch(
            @Valid @RequestBody List<PaqueteSimplificadoDTO> dtos) {
        return new ResponseEntity<>(paqueteService.createSimplificadoBatch(dtos), HttpStatus.CREATED);
    }

    @PostMapping("/importar-ref")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_EDITAR + "')")
    @Operation(summary = "Importar REF desde Excel", description = "Importa REF desde un archivo Excel. Columna A = número de guía, Columna B = REF. Busca cada paquete por número de guía y actualiza su REF.")
    public ResponseEntity<ImportResultDTO> importarRefDesdeExcel(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(paqueteService.importarRefDesdeExcel(file));
    }

    @PostMapping("/importar-ref-lista")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_EDITAR + "')")
    @Operation(summary = "Importar REF desde listas", description = "Actualiza REF de paquetes desde listas: cada elemento tiene numeroGuia y ref (opcional). ref vacío o null = sin REF.")
    public ResponseEntity<ImportResultDTO> importarRefDesdeLista(@Valid @RequestBody List<GuiaRefDTO> pares) {
        return ResponseEntity.ok(paqueteService.importarRefDesdeLista(pares));
    }

    /**
     * Importa y actualiza paquetes desde Excel.
     * Actualiza paquetes existentes (por número de guía) o crea nuevos; reemplaza clientes (remitente y destinatario).
     */
    @PostMapping("/importar-actualizar")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_EDITAR + "')")
    @Operation(summary = "Importar y actualizar paquetes desde Excel", description = "Actualiza paquetes existentes por número de guía o crea nuevos desde Excel. Reemplaza clientes remitente y destinatario.")
    public ResponseEntity<ImportResultDTO> importarYActualizarDesdeExcel(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(paqueteImportService.importarYActualizarDesdeExcel(file));
    }
}
