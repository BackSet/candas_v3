package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.ActualizarDestinoDespachoRapidoDTO;
import com.candas.candas_backend.dto.ActualizarPresintoSacaDTO;
import com.candas.candas_backend.dto.AgregarPaqueteRapidoDTO;
import com.candas.candas_backend.dto.CrearDespachoRapidoDTO;
import com.candas.candas_backend.dto.CrearSacaRapidaDTO;
import com.candas.candas_backend.dto.DespachoRapidoDTO;
import com.candas.candas_backend.dto.FinalizarDespachoRapidoDTO;
import com.candas.candas_backend.dto.MoverPaqueteRapidoDTO;
import com.candas.candas_backend.entity.enums.EstadoDespacho;
import com.candas.candas_backend.service.DespachoRapidoService;
import com.candas.candas_backend.util.PermissionConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API del módulo "Despachos rápidos" (MVP 1/4). Aislada del flujo clásico ({@code /api/v1/despachos})
 * y del masivo ({@code /api/v1/despacho-masivo}). Reutiliza los permisos {@code despachos:*}.
 */
@RestController
@RequestMapping("/api/v1/despachos-rapidos")
@Tag(name = "Despachos rápidos", description = "Ciclo de vida de despachos rápidos: borrador, ensacado, listo para guía y finalizado")
public class DespachoRapidoController {

    private final DespachoRapidoService despachoRapidoService;

    public DespachoRapidoController(DespachoRapidoService despachoRapidoService) {
        this.despachoRapidoService = despachoRapidoService;
    }

    @GetMapping
    @Operation(summary = "Listar despachos rápidos (por defecto, los activos no finalizados)")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_LISTAR + "') or hasAuthority('" + PermissionConstants.DESPACHOS_VER + "')")
    public ResponseEntity<List<DespachoRapidoDTO>> listar(@RequestParam(required = false) String estado) {
        return ResponseEntity.ok(despachoRapidoService.listar(parseEstado(estado)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener un despacho rápido por ID")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_VER + "')")
    public ResponseEntity<DespachoRapidoDTO> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(despachoRapidoService.obtener(id));
    }

    @PostMapping
    @Operation(summary = "Crear un despacho rápido (BORRADOR)")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_CREAR + "')")
    public ResponseEntity<DespachoRapidoDTO> crear(@Valid @RequestBody CrearDespachoRapidoDTO dto) {
        return new ResponseEntity<>(despachoRapidoService.crear(dto), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/paquetes")
    @Operation(summary = "Agregar (reservar) un paquete a una saca del despacho rápido")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_EDITAR + "')")
    public ResponseEntity<DespachoRapidoDTO> agregarPaquete(@PathVariable Long id,
            @Valid @RequestBody AgregarPaqueteRapidoDTO dto) {
        return ResponseEntity.ok(despachoRapidoService.agregarPaquete(id, dto));
    }

    @PostMapping("/{id}/paquetes/mover")
    @Operation(summary = "Mover un paquete reservado a otra saca del mismo despacho rápido")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_EDITAR + "')")
    public ResponseEntity<DespachoRapidoDTO> moverPaquete(@PathVariable Long id,
            @Valid @RequestBody MoverPaqueteRapidoDTO dto) {
        return ResponseEntity.ok(despachoRapidoService.moverPaquete(id, dto));
    }

    @PostMapping("/{id}/sacas")
    @Operation(summary = "Crear/cambiar a una saca nueva en el despacho rápido")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_EDITAR + "')")
    public ResponseEntity<DespachoRapidoDTO> crearSaca(@PathVariable Long id,
            @RequestBody(required = false) CrearSacaRapidaDTO dto) {
        return ResponseEntity.ok(despachoRapidoService.crearSacaEnDespacho(id, dto));
    }

    @PutMapping("/{id}/sacas/{idSaca}/presinto")
    @Operation(summary = "Ingresar/actualizar el presinto (sello físico) de una saca")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_EDITAR + "')")
    public ResponseEntity<DespachoRapidoDTO> actualizarPresinto(@PathVariable Long id,
            @PathVariable Long idSaca, @Valid @RequestBody ActualizarPresintoSacaDTO dto) {
        return ResponseEntity.ok(despachoRapidoService.actualizarPresintoSaca(id, idSaca, dto));
    }

    @PutMapping("/{id}/destino")
    @Operation(summary = "Actualizar destino y/o distribuidor del despacho rápido")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_EDITAR + "')")
    public ResponseEntity<DespachoRapidoDTO> actualizarDestino(@PathVariable Long id,
            @Valid @RequestBody ActualizarDestinoDespachoRapidoDTO dto) {
        return ResponseEntity.ok(despachoRapidoService.actualizarDestino(id, dto));
    }

    @PostMapping("/{id}/listo-para-guia")
    @Operation(summary = "Marcar el despacho rápido como LISTO_PARA_GUIA (requiere destino y paquetes)")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_EDITAR + "')")
    public ResponseEntity<DespachoRapidoDTO> marcarListoParaGuia(@PathVariable Long id) {
        return ResponseEntity.ok(despachoRapidoService.marcarListoParaGuia(id));
    }

    @PostMapping("/{id}/finalizar")
    @Operation(summary = "Finalizar el despacho rápido asignando la guía del distribuidor")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.DESPACHOS_EDITAR + "')")
    public ResponseEntity<DespachoRapidoDTO> finalizar(@PathVariable Long id,
            @Valid @RequestBody FinalizarDespachoRapidoDTO dto) {
        return ResponseEntity.ok(despachoRapidoService.finalizar(id, dto));
    }

    private static EstadoDespacho parseEstado(String estado) {
        if (estado == null || estado.isBlank()) {
            return null;
        }
        try {
            return EstadoDespacho.valueOf(estado.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
