-- V25__rename_manifiesto_pago_to_manifiesto_consolidado.sql

-- Renombrar tabla
ALTER TABLE manifiesto_pago RENAME TO manifiesto_consolidado;

-- Renombrar columnas
ALTER TABLE manifiesto_consolidado RENAME COLUMN id_manifiesto_pago TO id_manifiesto_consolidado;

-- Renombrar índices
ALTER INDEX idx_manifiesto_pago_agencia RENAME TO idx_manifiesto_consolidado_agencia;
ALTER INDEX idx_manifiesto_pago_fecha_generacion RENAME TO idx_manifiesto_consolidado_fecha_generacion;
