-- V111: Migrar despachos de Agencia id 24 (NEXA MISHEL) a Destinatario directo id 9 (GISELLA MISHEL AGUILAR BALCAZAR)

DO $$
DECLARE
  v_count INT;
BEGIN
  UPDATE despacho
  SET id_destinatario_directo = 9, id_agencia = NULL
  WHERE id_agencia = 24;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'V111: Se actualizaron % despachos (agencia 24 -> destinatario directo 9).', v_count;
END $$;
