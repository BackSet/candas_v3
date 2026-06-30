package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Finalizar un despacho rápido (LISTO_PARA_GUIA -> FINALIZADO) asignando la guía del
 * distribuidor. Normalmente lo ejecuta otro dispositivo de la misma cuenta.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinalizarDespachoRapidoDTO {
    @NotBlank(message = "El número de guía del distribuidor es obligatorio")
    private String numeroGuiaAgenciaDistribucion;

    /** Distribuidor responsable de la guía (opcional si ya estaba asignado). */
    private Long idDistribuidor;
}
