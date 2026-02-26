package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String type = "Bearer";
    private Long idUsuario;
    private String username;
    private String email;
    private String nombreCompleto;
    private List<String> roles;
    private List<String> permisos;
    private Long idAgencia;
}
