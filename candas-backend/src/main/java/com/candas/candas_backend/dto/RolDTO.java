package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RolDTO {
    private Long idRol;
    
    @NotBlank(message = "El nombre del rol es obligatorio")
    private String nombre;
    
    private String descripcion;
    private Boolean activo;
    private LocalDateTime fechaCreacion;
    private List<Long> permisos; // IDs de permisos para asignar
}
