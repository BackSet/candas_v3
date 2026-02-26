package com.candas.candas_backend.dto;

import com.candas.candas_backend.entity.enums.TamanoSaca;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SacaEnsacadoInfoDTO {
    private Long idSaca;
    private String codigoQr;
    private Integer numeroOrden;
    private TamanoSaca tamano;
    private BigDecimal pesoActual;
    private BigDecimal capacidadMaxima;
    private Integer paquetesActuales;
    private Integer paquetesEsperados;
    private BigDecimal porcentajeLlenado;
    private Boolean completada;
    private String destino; // Destino común de los paquetes en esta saca
    private List<String> paquetesPendientes; // Números de guía de paquetes pendientes
    private List<String> paquetesEnsacados; // Números de guía ya ensacados en esta saca
}
