package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
public class LoteRecepcionImportResultDTO {
    private int totalRegistros;
    private int paquetesEncontrados;
    private int paquetesNoEncontrados;
    private List<String> numerosGuiaNoEncontrados;
    private List<PaqueteDTO> paquetesAsociados;
    private List<PaqueteNoImportadoDTO> paquetesNoImportados;
    private List<String> numerosGuiaDuplicados;
    
    public LoteRecepcionImportResultDTO() {
        this.numerosGuiaNoEncontrados = new ArrayList<>();
        this.paquetesAsociados = new ArrayList<>();
        this.paquetesNoImportados = new ArrayList<>();
        this.numerosGuiaDuplicados = new ArrayList<>();
    }
}
