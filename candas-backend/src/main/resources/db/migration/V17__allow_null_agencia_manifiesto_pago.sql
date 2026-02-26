-- Permitir manifiestos de pago sin agencia específica (para manifiestos consolidados de todas las agencias)
ALTER TABLE manifiesto_pago ALTER COLUMN id_agencia DROP NOT NULL;
