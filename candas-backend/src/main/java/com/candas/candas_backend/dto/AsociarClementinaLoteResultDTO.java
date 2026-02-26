package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AsociarClementinaLoteResultDTO {
    private int totalAsociaciones;
    private int exitosas;
    private int fallidas;
    private List<ResultadoAsociacion> resultados;
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ResultadoAsociacion {
        private String numeroGuiaPadre;
        private String numeroGuiaHijo;
        private boolean exito;
        private String mensaje;
    }
}
