package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Mover un paquete ya reservado de una saca a otra dentro del mismo despacho rápido.
 * Identifica el paquete por {@code idPaquete} o por {@code numeroGuia} (al menos uno).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MoverPaqueteRapidoDTO {
    private Long idPaquete;
    private String numeroGuia;

    @NotNull(message = "La saca destino es obligatoria")
    private Long idSacaDestino;
}
