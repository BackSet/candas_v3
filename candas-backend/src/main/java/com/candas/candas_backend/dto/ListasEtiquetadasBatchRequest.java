package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ListasEtiquetadasBatchRequest {

    @NotBlank(message = "La etiqueta es obligatoria")
    private String etiqueta;

    @NotEmpty(message = "Debe incluir al menos un número de guía")
    private List<String> numerosGuia;

    /** Opcional: RETENER, PREGUNTAR, ATENCION, etc. Se guarda en observaciones. */
    private String instruccion;
}
