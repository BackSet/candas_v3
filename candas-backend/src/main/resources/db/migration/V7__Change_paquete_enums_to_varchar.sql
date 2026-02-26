-- Estrategia: Crear columnas temporales con NOMBRES DIFERENTES, copiar datos, eliminar ENUM, renombrar

-- 1. Crear columnas temporales VARCHAR con nombres diferentes
ALTER TABLE paquete ADD COLUMN IF NOT EXISTS estado_varchar VARCHAR(20);
ALTER TABLE paquete ADD COLUMN IF NOT EXISTS tipo_paquete_varchar VARCHAR(20);

-- 2. Copiar datos de las columnas ENUM a las nuevas columnas VARCHAR
UPDATE paquete SET estado_varchar = estado::text WHERE estado IS NOT NULL;
UPDATE paquete SET tipo_paquete_varchar = tipo_paquete::text WHERE tipo_paquete IS NOT NULL;

-- 3. Si no había datos, establecer valor por defecto para estado
UPDATE paquete SET estado_varchar = 'REGISTRADO' WHERE estado_varchar IS NULL;

-- 4. Eliminar las columnas ENUM originales (esto permite eliminar los tipos después)
ALTER TABLE paquete DROP COLUMN IF EXISTS estado;
ALTER TABLE paquete DROP COLUMN IF EXISTS tipo_paquete;

-- 5. Renombrar las columnas temporales a los nombres originales
ALTER TABLE paquete RENAME COLUMN estado_varchar TO estado;
ALTER TABLE paquete RENAME COLUMN tipo_paquete_varchar TO tipo_paquete;

-- 6. Añadir NOT NULL a estado
ALTER TABLE paquete ALTER COLUMN estado SET NOT NULL;

-- 7. Añadir restricciones CHECK
ALTER TABLE paquete ADD CONSTRAINT chk_estado_paquete_enum
    CHECK (estado IN ('REGISTRADO', 'RECIBIDO', 'ENSACADO', 'DESPACHADO'));

ALTER TABLE paquete ADD CONSTRAINT chk_tipo_paquete_enum
    CHECK (tipo_paquete IS NULL OR tipo_paquete IN ('CLEMENTINA', 'SEPARAR', 'AGENCIA', 'DOMICILIO'));

-- 8. Eliminar los tipos ENUM (ahora ya no hay dependencias)
DROP TYPE IF EXISTS estado_paquete_enum;
DROP TYPE IF EXISTS tipo_paquete_enum;
