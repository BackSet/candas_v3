package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnsacadoUltimaBusquedaRequestDTO {
    @NotBlank(message = "numeroGuia es requerido")
    private String numeroGuia;
}
