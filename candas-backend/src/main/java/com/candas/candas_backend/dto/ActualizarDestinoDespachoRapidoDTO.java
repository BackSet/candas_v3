package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Actualizar el destino y/o distribuidor de un despacho rápido (no FINALIZADO).
 * Agencia y destinatario directo son excluyentes; el destino es obligatorio antes de
 * pasar a LISTO_PARA_GUIA.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActualizarDestinoDespachoRapidoDTO {
    private Long idAgencia;
    private Long idDestinatarioDirecto;
    private Long idPaqueteOrigenDestinatario;
    private Long idDistribuidor;
}
