package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaqueteNoEncontradoDTO {
    private Long idPaqueteNoEncontrado;
    private Long idLoteRecepcion;
    private String numeroGuia;
    private LocalDateTime fechaRegistro;
    private String usuarioRegistro;
}
