-- Regenera codigo_presinto (código corto ~11 chars) con primeros 8 bytes del HMAC-SHA256, igual que PresintoUtil.
-- El secreto se inyecta por flyway.placeholders.presinto_secret en application.properties.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE despacho
SET codigo_presinto = substring(
    rtrim(
        replace(replace(
            encode(substring(hmac(
                (id_despacho::text || '|' || coalesce(replace(numero_manifiesto, ' ', ''), '') || '|' || to_char(fecha_despacho, 'YYYYMMDD')),
                $key$${presinto_secret}$key$,
                'sha256'
            ) from 1 for 8), 'base64'),
            '+', '-'), '/', '_'),
        '='
    ) from 1 for 12
);
