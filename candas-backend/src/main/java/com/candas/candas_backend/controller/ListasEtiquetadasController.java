package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.*;
import com.candas.candas_backend.service.ListasEtiquetadasService;
import com.candas.candas_backend.util.PermissionConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/paquetes/listas-etiquetadas")
@Tag(name = "Listas etiquetadas", description = "Flujo de listas etiquetadas (GEO, MIA) basado en Paquete")
@CrossOrigin(origins = "*")
public class ListasEtiquetadasController {

    private final ListasEtiquetadasService service;

    public ListasEtiquetadasController(ListasEtiquetadasService service) {
        this.service = service;
    }

    @PostMapping("/batch")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_CREAR + "')")
    @Operation(summary = "Crear lista (batch)", description = "Registra números de guía en una etiqueta; crea/actualiza paquetes con datos genéricos")
    public ResponseEntity<ListasEtiquetadasBatchResultDTO> createBatch(@Valid @RequestBody ListasEtiquetadasBatchRequest request) {
        return ResponseEntity.status(201).body(service.createBatch(request));
    }

    @GetMapping("/guia/{numeroGuia}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_VER + "')")
    @Operation(summary = "Consultar guía", description = "Obtiene etiqueta(s) y si está en varias listas")
    public ResponseEntity<GuiaListaEtiquetadaConsultaDTO> consultarGuia(@PathVariable String numeroGuia) {
        GuiaListaEtiquetadaConsultaDTO dto = service.consultarGuia(numeroGuia);
        return dto == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(dto);
    }

    @PostMapping("/consulta")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_VER + "')")
    @Operation(summary = "Consultar varias guías", description = "Retorna por cada número de guía la info de listas etiquetadas")
    public ResponseEntity<Map<String, GuiaListaEtiquetadaConsultaDTO>> consultarGuias(@RequestBody List<String> numerosGuia) {
        return ResponseEntity.ok(service.consultarGuias(numerosGuia));
    }

    @GetMapping("/guias-en-varias-listas")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_VER + "')")
    @Operation(summary = "Guías en varias listas", description = "Lista paquetes que están en más de una etiqueta (pendientes de elegir)")
    public ResponseEntity<List<GuiaListaEtiquetadaConsultaDTO>> getGuiasEnVariasListas() {
        return ResponseEntity.ok(service.getGuiasEnVariasListas());
    }

    @PostMapping("/elegir-etiqueta")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_VER + "')")
    @Operation(summary = "Elegir etiqueta", description = "Resuelve guía en varias listas: asigna la etiqueta elegida")
    public ResponseEntity<PaqueteDTO> elegirEtiqueta(@RequestBody Map<String, String> body) {
        String numeroGuia = body != null ? body.get("numeroGuia") : null;
        String etiqueta = body != null ? body.get("etiqueta") : null;
        return ResponseEntity.ok(service.elegirEtiqueta(numeroGuia, etiqueta));
    }

    @PostMapping("/marcar-receptado")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_VER + "')")
    @Operation(summary = "Marcar receptado", description = "Marca el paquete como RECIBIDO y opcionalmente lo asocia a un lote")
    public ResponseEntity<PaqueteDTO> marcarReceptado(@RequestBody Map<String, Object> body) {
        String numeroGuia = body != null && body.get("numeroGuia") != null ? body.get("numeroGuia").toString() : null;
        Long idLote = null;
        if (body != null && body.get("idLoteRecepcion") != null) {
            Object v = body.get("idLoteRecepcion");
            if (v instanceof Number) idLote = ((Number) v).longValue();
            else if (v instanceof String) try { idLote = Long.parseLong((String) v); } catch (NumberFormatException ignored) {}
        }
        return ResponseEntity.ok(service.marcarReceptado(numeroGuia, idLote));
    }

    @GetMapping("/historial-receptados")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_VER + "')")
    @Operation(summary = "Historial receptados", description = "Últimos paquetes de listas etiquetadas marcados como receptados")
    public ResponseEntity<List<PaqueteDTO>> getHistorialReceptados() {
        return ResponseEntity.ok(service.getHistorialReceptados());
    }

    @GetMapping("/etiqueta/{etiqueta}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_VER + "')")
    @Operation(summary = "Listar por etiqueta", description = "Paquetes con la etiqueta indicada (GEO, MIA, etc.)")
    public ResponseEntity<List<PaqueteDTO>> findByEtiqueta(@PathVariable String etiqueta) {
        return ResponseEntity.ok(service.findByEtiqueta(etiqueta));
    }

    @GetMapping("/etiquetas")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_VER + "')")
    @Operation(summary = "Todas las etiquetas", description = "Lista de etiquetas distintas usadas en paquetes")
    public ResponseEntity<List<String>> getAllEtiquetas() {
        return ResponseEntity.ok(service.getAllEtiquetas());
    }

    @GetMapping(value = "/export", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PAQUETES_VER + "')")
    @Operation(summary = "Exportar Excel", description = "Exporta paquetes de listas etiquetadas (opcional filtro por etiqueta); columnas Duplicado e Instrucción especial")
    public ResponseEntity<byte[]> export(
            @RequestParam(required = false) String etiqueta) {
        byte[] excel = service.exportExcel(etiqueta);
        String filename = "listas-etiquetadas" + (etiqueta != null && !etiqueta.isBlank() ? "-" + etiqueta : "") + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }
}
