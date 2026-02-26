-- Renombrar columna ciudad a canton en agencia y destinatario_directo
ALTER TABLE agencia RENAME COLUMN ciudad TO canton;
ALTER TABLE destinatario_directo RENAME COLUMN ciudad TO canton;
