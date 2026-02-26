package com.candas.candas_backend.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

/**
 * Genera el código del presinto para etiquetas Zebra.
 * Usa los primeros 8 bytes del HMAC-SHA256 (Base64url) para un código corto (~11 caracteres) que quepa en una línea en la etiqueta.
 */
@Component
public class PresintoUtil {

    private static final String HMAC_SHA256 = "HmacSHA256";
    /** Primeros 8 bytes del HMAC → Base64url sin padding ≈ 11 caracteres */
    private static final int HMAC_BYTES_USADOS = 8;
    private static final int MAX_LENGTH = 12;
    private static final DateTimeFormatter FECHA_FORMAT = DateTimeFormatter.BASIC_ISO_DATE;

    @Value("${candas.presinto.secret:${jwt.secret:candas-presinto-secret-key-min-32-chars}}")
    private String secret;

    /**
     * Genera un código de presinto único y no falsificable para el despacho.
     * Mismo despacho (id, manifiesto, fecha) siempre produce el mismo código (determinístico).
     *
     * @param idDespacho      id del despacho
     * @param numeroManifiesto número de manifiesto (puede ser null)
     * @param fechaDespacho   fecha del despacho (puede ser null)
     * @return código de presinto (Base64url de los primeros 8 bytes del HMAC), ~11 caracteres
     */
    public String generarCodigoPresinto(Long idDespacho, String numeroManifiesto, LocalDateTime fechaDespacho) {
        String payload = construirPayload(idDespacho, numeroManifiesto, fechaDespacho);
        byte[] hmacCompleto = hmacSha256(secret.getBytes(StandardCharsets.UTF_8), payload.getBytes(StandardCharsets.UTF_8));
        byte[] hmacCorto = java.util.Arrays.copyOf(hmacCompleto, HMAC_BYTES_USADOS);
        String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(hmacCorto);
        return encoded.length() > MAX_LENGTH ? encoded.substring(0, MAX_LENGTH) : encoded;
    }

    private String construirPayload(Long idDespacho, String numeroManifiesto, LocalDateTime fechaDespacho) {
        long id = idDespacho != null ? idDespacho : 0L;
        String manifiesto = numeroManifiesto != null ? numeroManifiesto.replaceAll("\\s", "") : "";
        String fechaStr = fechaDespacho != null ? fechaDespacho.toLocalDate().format(FECHA_FORMAT) : "";
        return id + "|" + manifiesto + "|" + fechaStr;
    }

    private static byte[] hmacSha256(byte[] key, byte[] data) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec spec = new SecretKeySpec(key, HMAC_SHA256);
            mac.init(spec);
            return mac.doFinal(data);
        } catch (Exception e) {
            throw new IllegalStateException("Error generando código de presinto", e);
        }
    }
}
