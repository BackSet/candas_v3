package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TelefonoAgenciaDTO {
    private Long idTelefono;
    private Long idAgencia;
    private String numero;
    private Boolean principal;
    private LocalDateTime fechaRegistro;
}
