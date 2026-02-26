package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermisoDTO {
    private Long idPermiso;
    
    @NotBlank(message = "El nombre del permiso es obligatorio")
    private String nombre;
    
    private String descripcion;
    private String recurso;
    private String accion;
}
