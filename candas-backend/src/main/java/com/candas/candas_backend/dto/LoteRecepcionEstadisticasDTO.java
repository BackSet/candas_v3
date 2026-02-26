package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoteRecepcionEstadisticasDTO {
    private Integer totalPaquetes;
    private Integer paquetesDespachados;
    private Integer paquetesPendientes;
    private BigDecimal porcentajeCompletado;
}
