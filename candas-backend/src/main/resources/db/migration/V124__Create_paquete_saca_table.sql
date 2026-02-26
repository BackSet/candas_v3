CREATE TABLE paquete_saca (
    id_paquete BIGINT NOT NULL,
    id_saca BIGINT NOT NULL,
    orden_en_saca INTEGER,
    PRIMARY KEY (id_paquete, id_saca),
    CONSTRAINT fk_paquete_saca_paquete FOREIGN KEY (id_paquete) REFERENCES paquete(id_paquete),
    CONSTRAINT fk_paquete_saca_saca FOREIGN KEY (id_saca) REFERENCES saca(id_saca)
);

-- Migrate existing data
INSERT INTO paquete_saca (id_paquete, id_saca, orden_en_saca)
SELECT id_paquete, id_saca, orden_en_saca FROM paquete WHERE id_saca IS NOT NULL;

-- Remove columns from paquete
-- Dropping the column with CASCADE will drop the foreign key constraint
ALTER TABLE paquete DROP COLUMN id_saca CASCADE;
ALTER TABLE paquete DROP COLUMN orden_en_saca;
