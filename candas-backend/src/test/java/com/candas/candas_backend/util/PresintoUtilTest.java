package com.candas.candas_backend.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PresintoUtilTest {

    private PresintoUtil presintoUtil;

    @BeforeEach
    void setUp() {
        presintoUtil = new PresintoUtil();
        ReflectionTestUtils.setField(presintoUtil, "secret", "candas-presinto-secret-key-min-32-chars");
    }

    @Test
    void generarCodigoPresintoSaca_esDeterministico() {
        LocalDateTime fecha = LocalDateTime.of(2026, 6, 22, 10, 0);
        String a = presintoUtil.generarCodigoPresintoSaca(1L, "MAN-00000001", 10L, 1, fecha);
        String b = presintoUtil.generarCodigoPresintoSaca(1L, "MAN-00000001", 10L, 1, fecha);
        assertEquals(a, b, "El mismo input debe producir el mismo código");
    }

    @Test
    void dosSacasDelMismoDespacho_generanPresintosDistintos() {
        LocalDateTime fecha = LocalDateTime.of(2026, 6, 22, 10, 0);
        String saca1 = presintoUtil.generarCodigoPresintoSaca(1L, "MAN-00000001", 10L, 1, fecha);
        String saca2 = presintoUtil.generarCodigoPresintoSaca(1L, "MAN-00000001", 11L, 2, fecha);
        assertNotEquals(saca1, saca2,
                "Dos sacas del mismo despacho no deben compartir presinto al diferir idSaca/numeroOrden");
    }

    @Test
    void presintoSaca_difiereDelPresintoDespacho() {
        LocalDateTime fecha = LocalDateTime.of(2026, 6, 22, 10, 0);
        String despacho = presintoUtil.generarCodigoPresinto(1L, "MAN-00000001", fecha);
        String saca = presintoUtil.generarCodigoPresintoSaca(1L, "MAN-00000001", 10L, 1, fecha);
        assertNotEquals(despacho, saca, "El presinto de saca no debe coincidir con el de despacho");
    }

    @Test
    void presintoSaca_respetaLongitudMaxima() {
        String codigo = presintoUtil.generarCodigoPresintoSaca(1L, "MAN-00000001", 10L, 1, LocalDateTime.now());
        assertNotNull(codigo);
        assertTrue(codigo.length() <= 12, "El código no debe exceder 12 caracteres");
    }
}
