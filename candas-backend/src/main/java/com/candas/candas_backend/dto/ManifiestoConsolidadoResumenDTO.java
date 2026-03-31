package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManifiestoConsolidadoResumenDTO {
    private Long idManifiestoConsolidado;
    private String numeroManifiesto;
    private Long idAgencia;
    private String nombreAgencia;
    private String codigoAgencia;
    private Long idAgenciaPropietaria;
    private String nombreAgenciaPropietaria;
    private String periodo;
    private LocalDateTime fechaGeneracion;
    private String usuarioGenerador;
    private Integer totalDespachos;
    private Integer totalSacas;
    private Integer totalPaquetes;
}
