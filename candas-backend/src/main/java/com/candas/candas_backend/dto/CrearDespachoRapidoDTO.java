package com.candas.candas_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Crear un despacho rápido. El destino es opcional al inicio (puede quedar en BORRADOR sin
 * destino ni guía de distribuidor); si se informa, agencia y destinatario directo son excluyentes.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CrearDespachoRapidoDTO {
    /** Destino agencia (excluyente con destinatario directo). */
    private Long idAgencia;
    /** Destino destinatario directo existente (excluyente con agencia). */
    private Long idDestinatarioDirecto;
    /** Alternativa: crear el destinatario directo desde el cliente destinatario de un paquete. */
    private Long idPaqueteOrigenDestinatario;
    /** Distribuidor (opcional; la guía externa se asigna al finalizar). */
    private Long idDistribuidor;
    private String observaciones;
}
