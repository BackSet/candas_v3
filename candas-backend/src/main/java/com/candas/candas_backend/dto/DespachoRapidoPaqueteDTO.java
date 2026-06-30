package com.candas.candas_backend.dto;

import com.candas.candas_backend.entity.enums.EstadoPaquete;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Vista ligera de un paquete reservado dentro de una saca de despacho rápido. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DespachoRapidoPaqueteDTO {
    private Long idPaquete;
    private String numeroGuia;
    private EstadoPaquete estado;
    private Integer ordenEnSaca;
}
