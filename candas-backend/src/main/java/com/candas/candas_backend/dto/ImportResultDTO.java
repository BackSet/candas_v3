package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
public class ImportResultDTO {
    private int totalRegistros;
    private int registrosExitosos;
    private int registrosFallidos;
    private List<String> errores;
    private List<PaqueteDTO> paquetesCreados;
    private List<PaqueteNoImportadoDTO> paquetesNoImportados;
    private List<String> numerosGuiaDuplicados;
    
    public ImportResultDTO() {
        this.errores = new ArrayList<>();
        this.paquetesCreados = new ArrayList<>();
        this.paquetesNoImportados = new ArrayList<>();
        this.numerosGuiaDuplicados = new ArrayList<>();
    }
}
