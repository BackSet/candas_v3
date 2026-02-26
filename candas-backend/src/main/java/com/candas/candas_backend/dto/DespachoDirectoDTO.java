package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DespachoDirectoDTO {
    
    private Long idDespachoDirecto;
    
    private Long idDespacho;
    
    private DestinatarioDirectoDTO destinatarioDirecto;
}
