package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TotalesManifiestoDTO {
    private Integer totalDespachos;
    private Integer totalSacas;
    private Integer totalPaquetes;
    private BigDecimal pesoTotal;
}
