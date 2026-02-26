package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgenciaDTO {
    private Long idAgencia;
    
    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;
    
    private String codigo;
    private String direccion;
    private String email;
    private String canton;
    private String nombrePersonal;
    private String horarioAtencion;
    private Boolean activa;
    private List<TelefonoAgenciaDTO> telefonos;
}
