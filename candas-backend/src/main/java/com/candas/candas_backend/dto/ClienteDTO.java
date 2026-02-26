package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClienteDTO {
    private Long idCliente;
    
    @NotBlank(message = "El nombre completo es obligatorio")
    private String nombreCompleto;
    
    private String documentoIdentidad;
    private String email;
    private String pais;
    private String ciudad;
    private String canton;
    private String direccion;
    private String telefono;
    private LocalDateTime fechaRegistro;
    private Boolean activo;
}
