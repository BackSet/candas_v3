package com.candas.candas_backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaqueteRapidoDTO {

    @NotNull(message = "El peso es requerido")
    @DecimalMin(value = "0.01", message = "El peso debe ser mayor a 0")
    private BigDecimal peso;

    @NotBlank(message = "La descripción es requerida")
    private String descripcion;

    @NotBlank(message = "El nombre del destinatario es requerido")
    private String nombreDestinatario;
}
