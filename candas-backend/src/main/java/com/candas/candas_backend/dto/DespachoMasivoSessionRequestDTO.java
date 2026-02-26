package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DespachoMasivoSessionRequestDTO {
    /** Payload del formulario Crear Despacho Masivo (JSON flexible). */
    private Map<String, Object> payload;
}
