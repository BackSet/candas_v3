package com.candas.candas_backend.dto;

import com.candas.candas_backend.entity.enums.TamanoSaca;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Crear (o "cambiar a") una saca nueva dentro de un despacho rápido. Ambos campos son
 * opcionales: el tamaño por defecto es MEDIANO y el presinto se autogenera si no se informa.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CrearSacaRapidaDTO {
    private TamanoSaca tamanoSaca;
    private String codigoPresinto;
}
