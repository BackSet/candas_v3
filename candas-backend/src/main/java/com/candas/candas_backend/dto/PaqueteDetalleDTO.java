package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaqueteDetalleDTO {
    private Long idPaquete;
    private String numeroGuia;
    private String ref;
    private String nombreClienteDestinatario;
    private String direccionDestinatarioCompleta;
    private String provinciaDestinatario;
    private String paisDestinatario;
    private String cantonDestinatario;
    private String telefonoDestinatario;
    private String observaciones;
}
