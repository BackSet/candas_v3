package com.candas.candas_backend.dto;

import com.candas.candas_backend.entity.enums.EstadoPaquete;
import com.candas.candas_backend.entity.enums.TipoDestino;
import com.candas.candas_backend.entity.enums.TipoPaquete;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** Vista operativa de un paquete reservado dentro de una saca de despacho rapido. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DespachoRapidoPaqueteDTO {
    private Long idPaquete;
    private String numeroGuia;
    private EstadoPaquete estado;
    private Integer ordenEnSaca;
    private TipoPaquete tipoPaquete;
    private TipoDestino tipoDestino;
    private BigDecimal pesoKilos;
    private String ref;
    private String observaciones;
    private String nombreClienteDestinatario;
    private String telefonoDestinatario;
    private String direccionDestinatario;
    private String cantonDestinatario;
    private String provinciaDestinatario;
    private String nombreAgenciaDestino;
    private String cantonAgenciaDestino;
    private String nombreDestinatarioDirecto;
    private String direccionDestinatarioDirecto;
    private String cantonDestinatarioDirecto;
}
