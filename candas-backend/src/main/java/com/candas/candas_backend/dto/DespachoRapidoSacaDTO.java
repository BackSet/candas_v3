package com.candas.candas_backend.dto;

import com.candas.candas_backend.entity.enums.TamanoSaca;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Saca de un despacho rápido con sus paquetes reservados. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DespachoRapidoSacaDTO {
    private Long idSaca;
    private Integer numeroOrden;
    private String codigoQr;
    private TamanoSaca tamano;
    private String codigoPresinto;
    private List<DespachoRapidoPaqueteDTO> paquetes;
}
