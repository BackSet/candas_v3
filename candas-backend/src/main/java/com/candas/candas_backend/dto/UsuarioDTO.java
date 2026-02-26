package com.candas.candas_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioDTO {
    private Long idUsuario;
    
    @NotBlank(message = "El username es obligatorio")
    private String username;
    
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email debe ser válido")
    private String email;
    
    private String password; // Solo para creación/actualización
    
    @NotBlank(message = "El nombre completo es obligatorio")
    private String nombreCompleto;
    
    private Boolean activo;
    private Boolean cuentaNoExpirada;
    private Boolean cuentaNoBloqueada;
    private Boolean credencialesNoExpiradas;
    private LocalDateTime fechaRegistro;
    private LocalDateTime ultimoAcceso;
    private Long idCliente;
    private Long idAgencia;
    private List<Long> roles; // IDs de roles para asignar
}
