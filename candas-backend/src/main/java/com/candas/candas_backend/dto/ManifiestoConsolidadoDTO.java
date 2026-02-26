package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManifiestoConsolidadoDTO {
    private Long idAgencia; // null = todas las agencias
    private Long idDistribuidor; // null = todos los distribuidores
    private Long idDestinatarioDirecto; // null = todos los destinatarios directos
    
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Integer mes;
    private Integer anio;
    
    private String usuarioGenerador;
}
