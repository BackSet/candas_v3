package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManifiestoConsolidadoDetalleDTO {
    private Long idManifiestoConsolidado;
    private String numeroManifiesto;
    private Long idAgencia;
    private String nombreAgencia;
    private String codigoAgencia;
    private String direccionAgencia;
    private String cantonAgencia;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Integer mes;
    private Integer anio;
    private LocalDateTime fechaGeneracion;
    private String usuarioGenerador;
    private List<DespachoDetalleDTO> despachos;
    private TotalesManifiestoDTO totales;
}
