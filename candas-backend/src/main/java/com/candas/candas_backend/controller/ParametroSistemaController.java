package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.PlantillaWhatsAppDespachoDTO;
import com.candas.candas_backend.service.ParametroSistemaService;
import com.candas.candas_backend.util.PermissionConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/parametros-sistema")
@Tag(name = "Parámetros del sistema", description = "Configuración del sistema (plantillas WhatsApp, etc.)")
@CrossOrigin(origins = "*")
public class ParametroSistemaController {

    private final ParametroSistemaService parametroSistemaService;

    public ParametroSistemaController(ParametroSistemaService parametroSistemaService) {
        this.parametroSistemaService = parametroSistemaService;
    }

    @GetMapping("/whatsapp-despacho")
    @Operation(summary = "Obtener plantilla WhatsApp para despachos")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PARAMETROS_SISTEMA_VER + "')")
    public ResponseEntity<PlantillaWhatsAppDespachoDTO> getPlantillaWhatsAppDespacho() {
        return ResponseEntity.ok(parametroSistemaService.getPlantillaWhatsAppDespacho());
    }

    @PutMapping("/whatsapp-despacho")
    @Operation(summary = "Guardar plantilla WhatsApp para despachos")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PARAMETROS_SISTEMA_EDITAR + "')")
    public ResponseEntity<PlantillaWhatsAppDespachoDTO> guardarPlantillaWhatsAppDespacho(
            @Valid @RequestBody PlantillaWhatsAppDespachoDTO dto) {
        parametroSistemaService.guardarPlantillaWhatsAppDespacho(dto.getPlantilla());
        return ResponseEntity.ok(parametroSistemaService.getPlantillaWhatsAppDespacho());
    }

    @GetMapping("/whatsapp-despacho/variables")
    @Operation(summary = "Listar variables disponibles para la plantilla WhatsApp despacho")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.PARAMETROS_SISTEMA_VER + "')")
    public ResponseEntity<List<VariablePlantillaDespacho>> getVariablesPlantillaDespacho() {
        return ResponseEntity.ok(VariablePlantillaDespacho.listado());
    }

    /**
     * DTO para exponer variables disponibles en la plantilla de despacho.
     */
    public record VariablePlantillaDespacho(String clave, String descripcion) {
        public static List<VariablePlantillaDespacho> listado() {
            return List.of(
                    new VariablePlantillaDespacho("numero_manifiesto", "Número de manifiesto"),
                    new VariablePlantillaDespacho("fecha_despacho", "Fecha del despacho"),
                    new VariablePlantillaDespacho("destinatario_directo", "Destino / destinatario directo"),
                    new VariablePlantillaDespacho("encargado", "Nombre del encargado"),
                    new VariablePlantillaDespacho("distribuidor", "Nombre del distribuidor"),
                    new VariablePlantillaDespacho("guia", "Número de guía (principal)"),
                    new VariablePlantillaDespacho("guias", "Lista de números de guía"),
                    new VariablePlantillaDespacho("cantidad_sacas", "Cantidad de sacas"),
                    new VariablePlantillaDespacho("cantidad_paquetes", "Cantidad de paquetes"),
                    new VariablePlantillaDespacho("detalle_sacas", "Detalle de sacas (ej. 1. Saca #1 (0 paq)\\n2. Saca #2 (0 paq))"),
                    new VariablePlantillaDespacho("agencia", "Nombre de la agencia"),
                    new VariablePlantillaDespacho("observaciones", "Observaciones del despacho"),
                    new VariablePlantillaDespacho("codigo_presinto", "Código del presinto")
            );
        }
    }
}
