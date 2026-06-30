package com.candas.candas_backend.entity.enums;

/**
 * Estados del ciclo de vida de un despacho (módulo "Despachos rápidos").
 *
 * <ul>
 *   <li>{@code BORRADOR}: despacho recién creado; puede existir sin destino ni guía de distribuidor.</li>
 *   <li>{@code EN_ENSACADO}: ya tiene paquetes reservados en sacas; sigue editándose.</li>
 *   <li>{@code LISTO_PARA_GUIA}: cerrado en bodega y pendiente de la guía del distribuidor
 *       (otro dispositivo de la misma cuenta puede finalizarlo). Requiere destino definido.</li>
 *   <li>{@code FINALIZADO}: despacho cerrado con guía de distribuidor. Es también el estado
 *       de los despachos del flujo clásico/históricos.</li>
 * </ul>
 */
public enum EstadoDespacho {
    BORRADOR,
    EN_ENSACADO,
    LISTO_PARA_GUIA,
    FINALIZADO
}
