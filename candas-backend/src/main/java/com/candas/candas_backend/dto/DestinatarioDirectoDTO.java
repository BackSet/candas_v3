package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DestinatarioDirectoDTO {
    
    private Long idDestinatarioDirecto;
    
    @NotBlank(message = "El nombre del destinatario es obligatorio")
    private String nombreDestinatario;
    
    @NotBlank(message = "El teléfono del destinatario es obligatorio")
    private String telefonoDestinatario;
    
    private String direccionDestinatario;
    
    private String canton;
    
    private String codigo;

    private String nombreEmpresa;

    private LocalDateTime fechaRegistro;
    
    private Boolean activo;
}
