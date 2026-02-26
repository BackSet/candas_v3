package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnsacadoSessionResponseDTO {
    private PaqueteEnsacadoInfoDTO lastPaqueteInfo;
    private String lastUpdated; // ISO-8601
}
