package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PuntoOrigenDTO {
    private Long idPuntoOrigen;
    
    @NotBlank(message = "El nombre del punto de origen es obligatorio")
    private String nombrePuntoOrigen;
    
    private Boolean activo;
}
