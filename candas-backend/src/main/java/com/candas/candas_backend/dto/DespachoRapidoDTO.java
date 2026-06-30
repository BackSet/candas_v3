package com.candas.candas_backend.dto;

import com.candas.candas_backend.entity.enums.EstadoDespacho;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/** Respuesta canónica de un despacho rápido (detalle y elementos de lista). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DespachoRapidoDTO {
    private Long idDespacho;
    private String numeroManifiesto;
    private EstadoDespacho estado;
    private LocalDateTime fechaDespacho;
    private String usuarioRegistro;
    private String observaciones;

    // Destino: agencia o destinatario directo (excluyentes).
    private Long idAgencia;
    private String nombreAgencia;
    private String codigoAgencia;
    private String telefonoAgencia;
    private String direccionAgencia;
    private String cantonAgencia;
    private Long idDestinatarioDirecto;
    private String nombreDestinatarioDirecto;
    private String codigoDestinatarioDirecto;
    private String telefonoDestinatarioDirecto;
    private String direccionDestinatarioDirecto;
    private String cantonDestinatarioDirecto;
    private String nombreEmpresaDestinatarioDirecto;

    private Long idAgenciaPropietaria;
    private String nombreAgenciaPropietaria;

    // Distribuidor y guía externa (se completan al finalizar).
    private Long idDistribuidor;
    private String nombreDistribuidor;
    private String numeroGuiaAgenciaDistribucion;

    // Resumen operativo.
    private int totalSacas;
    private int totalPaquetes;

    private List<DespachoRapidoSacaDTO> sacas;
}
