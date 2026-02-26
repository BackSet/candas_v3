package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuiaRefDTO {

    @NotBlank(message = "El número de guía es obligatorio")
    private String numeroGuia;

    /** REF opcional; null o vacío = sin REF */
    private String ref;
}
