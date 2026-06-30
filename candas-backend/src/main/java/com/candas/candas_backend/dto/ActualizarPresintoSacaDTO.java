package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Ingresar/actualizar el presinto (sello físico) de una saca de un despacho rápido. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActualizarPresintoSacaDTO {
    @NotBlank(message = "El presinto es obligatorio")
    @Size(max = 64, message = "El presinto no puede superar 64 caracteres")
    private String codigoPresinto;
}
