package com.candas.candas_backend.util;

import java.math.BigDecimal;

/**
 * Valores por defecto para paquetes creados desde el flujo de listas etiquetadas (GEO, MIA, etc.).
 */
public final class ListasEtiquetadasConstants {

    private ListasEtiquetadasConstants() {}

    /** Peso en kg por defecto */
    public static final BigDecimal PESO_KILOS_DEFAULT = new BigDecimal("3.63");
    /** Peso en libras por defecto */
    public static final BigDecimal PESO_LIBRAS_DEFAULT = new BigDecimal("8");
    /** Medidas por defecto (L/W/H) */
    public static final String MEDIDAS_DEFAULT = "L:0.00/ W:0.00/ H:0.00";
    /** Valor declarado por defecto */
    public static final BigDecimal VALOR_DEFAULT = new BigDecimal("100");
    /** Tarifa position por defecto */
    public static final String TARIFA_POSITION_DEFAULT = "98.07.20.00.00";
    /** SED por defecto */
    public static final String SED_DEFAULT = "30.37a";

    /** Valor de ref cuando la guía está en varias listas y el operario aún no ha elegido */
    public static final String REF_VARIAS_LISTAS = "VARIAS";
}
