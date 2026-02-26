package com.candas.candas_backend.dto;

import com.candas.candas_backend.entity.enums.TamanoSaca;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SacaDetalleDTO {
    private Long idSaca;
    private Integer numeroOrden;
    private TamanoSaca tamano;
    private String codigoQr;
    private Integer cantidadPaquetes;
    private List<PaqueteDetalleDTO> paquetes;
}
