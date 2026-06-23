package com.candas.candas_backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DespachoDTO {
    private Long idDespacho;
    
    private String numeroManifiesto; // Se genera automáticamente
    
    @NotNull(message = "La fecha de despacho es obligatoria")
    private LocalDateTime fechaDespacho;
    
    private String usuarioRegistro;
    
    private String observaciones;
    
    private Long idAgencia;
    private String nombreAgencia; // Nombre de la agencia para mostrar en listas
    private String cantonAgencia; // Cantón de la agencia para mostrar en listas

    private Long idAgenciaPropietaria;
    private String nombreAgenciaPropietaria;
    
    private Long idDistribuidor;
    private String nombreDistribuidor; // Nombre del distribuidor para mostrar en listas
    
    private String numeroGuiaAgenciaDistribucion;
    
    private Long idDestinatarioDirecto; // Para crear/editar

    /** Si se envía, se crea un DestinatarioDirecto desde el cliente destinatario del paquete y se asocia al despacho. Se ignora si también se envía idDestinatarioDirecto. */
    private Long idPaqueteOrigenDestinatario;

    private DespachoDirectoDTO despachoDirecto; // Para lectura

    /**
     * @deprecated Legacy. El presinto operativo vive en {@link SacaDTO#getCodigoPresinto()}.
     * Se mantiene por compatibilidad con datos históricos; el frontend ya no lo envía ni lo lee.
     */
    @Deprecated
    @Size(max = 64)
    private String codigoPresinto;
    
    @Valid
    private List<SacaDTO> sacas; // Para crear/editar sacas junto con el despacho
}
