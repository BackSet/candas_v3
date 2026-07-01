-- Backfill de lotes de recepción automáticos (tipo_lote = 'AUTOMATICO_DESPACHO') para paquetes
-- históricos que llegaron a un despacho/saca sin pasar nunca por un lote de recepción.
--
-- La regla de agrupación (fecha del despacho truncada al día + agencia propietaria del despacho)
-- y el formato determinístico de numero_recepcion ('REC-AUTO-<idAgenciaPropietaria>-<yyyyMMdd>')
-- replican exactamente lo que hace LoteRecepcionAutomaticoService en tiempo real para paquetes
-- nuevos, de modo que un lote ya creado por el servicio (o por esta migración) nunca se duplica.
--
-- Alcance (no se toca nada fuera de esto):
--   - Solo paquetes con id_lote_recepcion IS NULL.
--   - Solo paquetes asociados a paquete_saca cuya saca esté asociada a un despacho
--     (saca.id_despacho IS NOT NULL).
--   - Solo si ese despacho tiene agencia propietaria y fecha de despacho (siempre las tiene tras
--     V131 y por ser NOT NULL en columna, pero se valida de forma explícita y defensiva).
--   - No se modifica estado ni fecha_recepcion del paquete: solo se asigna id_lote_recepcion.
--   - No se eliminan ni duplican paquetes ni lotes existentes.
--
-- Idempotencia: el INSERT usa ON CONFLICT (numero_recepcion) DO NOTHING (columna única); el
-- UPDATE solo afecta paquetes con id_lote_recepcion IS NULL. Ejecutar esta migración dos veces
-- (p. ej. en un repair) no crea lotes duplicados ni reasigna paquetes ya asociados.

-- 0) Resincronizar la secuencia de la clave primaria de lote_recepcion para evitar colisiones con IDs históricos.
SELECT setval(
    pg_get_serial_sequence('lote_recepcion', 'id_lote_recepcion'),
    COALESCE(MAX(id_lote_recepcion), 1)
) FROM lote_recepcion;

-- 1) Crear los lotes automáticos que falten (agrupados por agencia propietaria + día de despacho).
INSERT INTO lote_recepcion (tipo_lote, numero_recepcion, id_agencia, fecha_recepcion)
SELECT DISTINCT
    'AUTOMATICO_DESPACHO',
    'REC-AUTO-' || d.id_agencia_propietaria::text || '-' || to_char(d.fecha_despacho, 'YYYYMMDD'),
    d.id_agencia_propietaria,
    date_trunc('day', d.fecha_despacho)
FROM paquete p
JOIN paquete_saca ps ON ps.id_paquete = p.id_paquete
JOIN saca s ON s.id_saca = ps.id_saca
JOIN despacho d ON d.id_despacho = s.id_despacho
WHERE p.id_lote_recepcion IS NULL
  AND s.id_despacho IS NOT NULL
  AND d.id_agencia_propietaria IS NOT NULL
  AND d.fecha_despacho IS NOT NULL
ON CONFLICT (numero_recepcion) DO NOTHING;

-- 2) Asociar cada paquete elegible a su lote automático correspondiente.
-- Subconsulta correlacionada (en vez de UPDATE ... FROM) para resolver de forma determinística
-- el caso defensivo de un paquete con más de una fila en paquete_saca: se toma la asociación de
-- mayor id_saca (la más reciente), en vez de dejar que Postgres elija una fila arbitraria.
UPDATE paquete p
SET id_lote_recepcion = (
    SELECT lr.id_lote_recepcion
    FROM paquete_saca ps
    JOIN saca s ON s.id_saca = ps.id_saca
    JOIN despacho d ON d.id_despacho = s.id_despacho
    JOIN lote_recepcion lr
        ON lr.tipo_lote = 'AUTOMATICO_DESPACHO'
       AND lr.id_agencia = d.id_agencia_propietaria
       AND lr.numero_recepcion = 'REC-AUTO-' || d.id_agencia_propietaria::text || '-' || to_char(d.fecha_despacho, 'YYYYMMDD')
    WHERE ps.id_paquete = p.id_paquete
      AND s.id_despacho IS NOT NULL
      AND d.id_agencia_propietaria IS NOT NULL
      AND d.fecha_despacho IS NOT NULL
    ORDER BY ps.id_saca DESC
    LIMIT 1
)
WHERE p.id_lote_recepcion IS NULL
  AND EXISTS (
    SELECT 1
    FROM paquete_saca ps
    JOIN saca s ON s.id_saca = ps.id_saca
    JOIN despacho d ON d.id_despacho = s.id_despacho
    WHERE ps.id_paquete = p.id_paquete
      AND s.id_despacho IS NOT NULL
      AND d.id_agencia_propietaria IS NOT NULL
      AND d.fecha_despacho IS NOT NULL
  );
