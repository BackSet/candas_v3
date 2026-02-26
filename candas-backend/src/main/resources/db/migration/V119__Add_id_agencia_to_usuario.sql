-- Asociar usuario con agencia (opcional)
ALTER TABLE usuario ADD COLUMN id_agencia BIGINT NULL;
ALTER TABLE usuario ADD CONSTRAINT fk_usuario_agencia FOREIGN KEY (id_agencia) REFERENCES agencia(id_agencia);
