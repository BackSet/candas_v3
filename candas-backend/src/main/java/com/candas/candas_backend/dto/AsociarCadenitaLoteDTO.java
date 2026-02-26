package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AsociarCadenitaLoteDTO {

    @NotBlank(message = "El número de guía del padre es requerido")
    private String numeroGuiaPadre;

    @NotNull(message = "La lista de guías hijos es requerida")
    private List<String> numeroGuiasHijos;
}
