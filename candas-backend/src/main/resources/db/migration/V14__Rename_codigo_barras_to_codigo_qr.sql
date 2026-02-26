-- Renombrar columna codigo_barras a codigo_qr en la tabla saca
ALTER TABLE saca RENAME COLUMN codigo_barras TO codigo_qr;
