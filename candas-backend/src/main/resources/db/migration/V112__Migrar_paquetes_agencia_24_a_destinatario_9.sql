-- V112: Migrar paquetes de Agencia id 24 (NEXA MISHEL) a Destinatario directo id 9 (GISELLA MISHEL AGUILAR BALCAZAR)

DO $$
DECLARE
  v_count INT;
BEGIN
  UPDATE paquete
  SET id_destinatario_directo = 9, id_agencia_destino = NULL, tipo_destino = 'DOMICILIO'
  WHERE id_agencia_destino = 24;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'V112: Se actualizaron % paquetes (agencia_destino 24 -> destinatario directo 9).', v_count;
END $$;
