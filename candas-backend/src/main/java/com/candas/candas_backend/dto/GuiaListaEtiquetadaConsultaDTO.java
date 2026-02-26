package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuiaListaEtiquetadaConsultaDTO {

    private String numeroGuia;
    /** Lista de etiquetas (una o más: GEO, MIA, o VARIAS cuando está en varias listas) */
    private List<String> etiquetas;
    /** true cuando el paquete está en varias listas y el operario debe elegir */
    private boolean variasListas;
    private LocalDateTime fechaRecepcion;
    /** Instrucción si existe (ej. Retener), extraída de observaciones " Instrucción: ..." */
    private String instruccion;
}
