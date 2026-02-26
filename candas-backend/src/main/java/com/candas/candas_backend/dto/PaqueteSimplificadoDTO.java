package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaqueteSimplificadoDTO {
    
    @NotBlank(message = "El número de guía es obligatorio")
    private String numeroGuia;
    
    private String observaciones;
    
    private Long idClienteRemitente; // Opcional - si no se proporciona, se usará uno por defecto
}
