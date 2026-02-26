package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DespachoEnsacadoInfoDTO {
    private Long idDespacho;
    private String numeroManifiesto;
    private LocalDateTime fechaDespacho;
    private LocalDateTime fechaUltimoEnsacado;
    private List<SacaEnsacadoInfoDTO> sacas;
    private BigDecimal porcentajeCompletado;
    private Integer totalPaquetes;
    private Integer paquetesEnsacados;
    private Integer paquetesPendientes;
    private Boolean completado;
    private String destino; // Agencia, distribuidor o destinatario directo
}
