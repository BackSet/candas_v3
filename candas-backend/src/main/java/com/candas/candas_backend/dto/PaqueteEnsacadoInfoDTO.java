package com.candas.candas_backend.dto;

import com.candas.candas_backend.entity.enums.TamanoSaca;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaqueteEnsacadoInfoDTO {
    private Long idPaquete;
    private String numeroGuia;
    
    // Información de la saca asignada
    private Long idSacaAsignada;
    private String codigoQrSaca;
    private Integer numeroOrdenSaca;
    private TamanoSaca tamanoSaca;
    private String destino; // Agencia destino o dirección completa del destinatario
    
    // Información de llenado de la saca
    private BigDecimal porcentajeLlenadoSaca;
    private Integer paquetesEnSaca;
    private Integer paquetesFaltantesSaca;
    private BigDecimal pesoActualSaca;
    private BigDecimal capacidadMaximaSaca;
    
    // Información del despacho completo
    private Long idDespacho;
    private String numeroManifiesto;
    private LocalDateTime fechaDespacho;
    private Integer totalSacas;
    private BigDecimal porcentajeLlenadoDespacho;
    private Integer paquetesEnDespacho;
    private Integer paquetesFaltantesDespacho;
    private Boolean despachoLleno;
    
    // Mensajes y alertas
    private String mensajeAlerta; // "Saca llena", "Despacho completo", etc.
    private Boolean sacaLlena; // Si la saca está al 100% de capacidad
    private Boolean yaEnsacado; // Si el paquete ya está ensacado físicamente
    
    // Información de agencia (si el despacho es para una agencia)
    private Long idAgencia;
    private String nombreAgencia;
    private String direccionAgencia;
    private String cantonAgencia;
    private String telefonoAgencia;
    
    // Información de destinatario directo (si el despacho es directo)
    private Long idDestinatarioDirecto;
    private String nombreDestinatarioDirecto;
    private String telefonoDestinatarioDirecto;
    private String direccionDestinatarioDirecto;
    
    // Información del paquete (dirección y observaciones)
    private String direccionDestinatarioCompleta; // Dirección completa del destinatario del paquete
    private String observaciones; // Observaciones del paquete
    private Boolean enSaca; // Si el paquete está asignado a una saca
}
