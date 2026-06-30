package com.candas.candas_backend.dto;

import com.candas.candas_backend.entity.enums.TamanoSaca;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Agregar (reservar) un paquete a una saca del despacho rápido.
 * Si {@code idSaca} es nulo, se usa la última saca del despacho o se crea la primera.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgregarPaqueteRapidoDTO {
    @NotBlank(message = "El número de guía es obligatorio")
    private String numeroGuia;

    /** Saca destino; si es nula, se reutiliza la última saca o se crea una nueva. */
    private Long idSaca;

    /** Tamaño usado solo si se crea una saca nueva (por defecto MEDIANO). */
    private TamanoSaca tamanoSaca;
}
