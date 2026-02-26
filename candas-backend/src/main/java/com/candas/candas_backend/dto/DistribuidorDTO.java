package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DistribuidorDTO {
    private Long idDistribuidor;
    
    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;
    
    private String codigo;
    private String email;
    private Boolean activa;
}
