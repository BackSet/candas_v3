package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaqueteNoImportadoDTO {
    private String numeroGuia;
    private String motivo;
    private Integer numeroFila; // Para Excel, puede ser null para listados manuales
}
