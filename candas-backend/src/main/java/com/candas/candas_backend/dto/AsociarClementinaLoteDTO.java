package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AsociarClementinaLoteDTO {
    private List<ParClementina> asociaciones;
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ParClementina {
        private String numeroGuiaPadre;
        private String numeroGuiaHijo;
    }
}
