-- V108: Migrar despachos de NEXA MISHELL (AGENCIA) a GISELLA MISHEL AGUILAR BALCAZAR (destinatario directo)
-- Para cada despacho asociado a la agencia NEXA MISHELL se crea fila en despacho_directo
-- con el destinatario GISELLA MISHEL AGUILAR BALCAZAR y se quita la asociación a la agencia.

DO $$
DECLARE
  v_id_agencia BIGINT;
  v_id_destinatario BIGINT;
  v_count_insert INT;
  v_count_update INT;
BEGIN
  SELECT id_agencia INTO v_id_agencia
  FROM agencia
  WHERE TRIM(nombre) = 'NEXA MISHELL (AGENCIA)'
  LIMIT 1;

  SELECT id_destinatario_directo INTO v_id_destinatario
  FROM destinatario_directo
  WHERE TRIM(nombre_destinatario) = 'GISELLA MISHEL AGUILAR BALCAZAR'
  LIMIT 1;

  IF v_id_agencia IS NULL THEN
    RAISE NOTICE 'V108: No se encontró agencia con nombre NEXA MISHELL (AGENCIA). No hay despachos que migrar.';
    RETURN;
  END IF;

  IF v_id_destinatario IS NULL THEN
    RAISE EXCEPTION 'V108: No existe el destinatario directo GISELLA MISHEL AGUILAR BALCAZAR. Créalo antes de ejecutar esta migración.';
  END IF;

  INSERT INTO despacho_directo (id_despacho, id_destinatario_directo)
  SELECT d.id_despacho, v_id_destinatario
  FROM despacho d
  WHERE d.id_agencia = v_id_agencia
    AND NOT EXISTS (SELECT 1 FROM despacho_directo dd WHERE dd.id_despacho = d.id_despacho);

  GET DIAGNOSTICS v_count_insert = ROW_COUNT;
  RAISE NOTICE 'V108: Se crearon % filas en despacho_directo.', v_count_insert;

  UPDATE despacho SET id_agencia = NULL WHERE id_agencia = v_id_agencia;
  GET DIAGNOSTICS v_count_update = ROW_COUNT;
  RAISE NOTICE 'V108: Se actualizaron % despachos (agencia quitada).', v_count_update;
END $$;
