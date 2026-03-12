package com.candas.candas_backend.dto;

import com.candas.candas_backend.entity.enums.EstadoPaquete;
import com.candas.candas_backend.entity.enums.TipoPaquete;
import com.candas.candas_backend.entity.enums.TipoDestino;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaqueteDTO {
    private Long idPaquete;
    private String numeroGuia;
    private String numeroMaster;
    private BigDecimal pesoKilos;

    @NotNull(message = "El estado es obligatorio")
    private EstadoPaquete estado;

    private TipoPaquete tipoPaquete; // Puede ser null al inicio

    private TipoDestino tipoDestino; // Puede ser null si no tiene destino asignado

    // Destinatario directo asignado (opcional; principalmente para tipoDestino =
    // DOMICILIO)
    private Long idDestinatarioDirecto;

    private Long idPuntoOrigen;
    private String nombrePuntoOrigen; // Nombre del punto de origen

    @NotNull(message = "El cliente remitente es obligatorio")
    private Long idClienteRemitente;
    private String nombreClienteRemitente; // Nombre del cliente remitente

    private String direccionRemitenteCompleta; // Dirección completa formateada
    private String paisRemitente;
    private String provinciaRemitente;
    private String cantonRemitente;
    private String direccionRemitente;

    private Long idClienteDestinatario;
    private String nombreClienteDestinatario; // Nombre del cliente destinatario
    private String telefonoDestinatario; // Teléfono del cliente destinatario (String para compatibilidad)
    private String documentoDestinatario; // Documento del cliente destinatario

    // Dirección del destinatario
    private String direccionDestinatarioCompleta; // Dirección completa formateada
    private String paisDestinatario;
    private String provinciaDestinatario;
    private String cantonDestinatario;
    private String direccionDestinatario;

    private Long idAgenciaDestino;
    private String nombreAgenciaDestino; // Nombre de la agencia destino
    private String cantonAgenciaDestino; // Cantón de la agencia destino
    private String codigoAgenciaDestino; // Código de la agencia destino

    private Long idLoteRecepcion;
    private String numeroRecepcion; // Número de recepción

    private Long idSaca;
    private String numeroSaca; // Número de saca

    private Long idDespacho; // ID del despacho si el paquete está en un despacho
    private String numeroManifiesto; // Número de manifiesto del despacho
    private String nombreAgenciaDespacho; // Agencia del despacho (si el despacho es a agencia)
    private String cantonAgenciaDespacho;
    private String nombreDestinatarioDirectoDespacho; // Destinatario directo del despacho (si es directo)
    private String direccionDestinatarioDirectoDespacho;

    private Long idPaquetePadre;
    private String numeroGuiaPaquetePadre; // Número de guía del paquete padre
    private String etiquetaDestinatario;
    private LocalDateTime fechaRegistro;
    private LocalDateTime fechaRecepcion;
    private LocalDateTime fechaEnsacado;
    private String observaciones;
    private String sed;
    private String medidas;
    private BigDecimal pesoLibras;
    private String descripcion;
    private BigDecimal valor;
    private String tarifaPosition;
    private String ref;

    // Campos para operaciones especiales
    private Boolean etiquetaCambiada; // Para CLEMENTINA
    private Boolean separado; // Para SEPARAR
    private Boolean unidoEnCaja; // Para CADENITA
    private LocalDateTime fechaEtiquetaCambiada;
    private LocalDateTime fechaSeparado;
    private LocalDateTime fechaUnidoEnCaja;
}
