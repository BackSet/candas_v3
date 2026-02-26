package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ListasEtiquetadasBatchResultDTO {

    private int totalProcesados;
    private List<PaqueteDTO> paquetes;
    /** Números de guía que quedaron en varias listas (ref = VARIAS) */
    private List<String> guiasEnVariasListas;
}
