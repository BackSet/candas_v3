package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DespachoMasivoSessionResponseDTO {
    /** Payload de la sesión (null si no hay datos). */
    private Map<String, Object> payload;
    /** Última actualización en ISO-8601. */
    private String lastUpdated;
}
