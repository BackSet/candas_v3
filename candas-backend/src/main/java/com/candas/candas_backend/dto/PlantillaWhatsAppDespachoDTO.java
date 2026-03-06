package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlantillaWhatsAppDespachoDTO {

    @NotBlank(message = "La plantilla no puede estar vacía")
    private String plantilla;
}
