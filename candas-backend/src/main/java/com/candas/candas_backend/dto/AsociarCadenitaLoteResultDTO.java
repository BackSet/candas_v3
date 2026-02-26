package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AsociarCadenitaLoteResultDTO {

    private String numeroGuiaPadre;
    private int totalAsociaciones;
    private int exitosas;
    private int fallidas;
    private List<ResultadoCadenita> resultados;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ResultadoCadenita {
        private String numeroGuiaHijo;
        private boolean exito;
        private String mensaje;
    }
}
