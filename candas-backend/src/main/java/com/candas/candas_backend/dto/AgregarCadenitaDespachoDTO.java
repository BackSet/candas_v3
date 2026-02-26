package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgregarCadenitaDespachoDTO {

    @NotBlank(message = "El número de guía del padre es requerido")
    private String numeroGuiaPadre;
}
