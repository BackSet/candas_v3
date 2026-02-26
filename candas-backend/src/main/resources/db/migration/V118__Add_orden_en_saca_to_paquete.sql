-- Orden de paquetes dentro de cada saca (según tipiado/escaneo del operario)
ALTER TABLE paquete ADD COLUMN IF NOT EXISTS orden_en_saca INTEGER NULL;

COMMENT ON COLUMN paquete.orden_en_saca IS 'Orden del paquete dentro de la saca (1, 2, 3...); coincide con el orden de escaneo al crear el despacho.';
