package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DespachoDetalleDTO {
    private Long idDespacho;
    private String numeroManifiesto;
    private LocalDateTime fechaDespacho;
    private String numeroGuiaAgenciaDistribucion;
    private String nombreDistribuidor;
    private String nombreAgencia; // Para mostrar cuando es todas las agencias
    private String codigoAgencia; // Para mostrar cuando es todas las agencias
    private String cantonAgencia; // Cantón de la agencia
    // Información de destinatario directo (si el despacho es directo)
    private Boolean esDestinatarioDirecto; // Indica si es un despacho para destinatario directo
    private String nombreDestinatarioDirecto;
    private String telefonoDestinatarioDirecto;
    private String direccionDestinatarioDirecto;
    private String cantonDestinatarioDirecto; // Cantón del destinatario directo
    private List<SacaDetalleDTO> sacas;
    private Integer totalSacas;
    private Integer totalPaquetes;
    private String codigoPresinto;
}
