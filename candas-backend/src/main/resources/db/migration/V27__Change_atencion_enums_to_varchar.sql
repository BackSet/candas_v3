-- Estrategia: Crear columnas temporales con NOMBRES DIFERENTES, copiar datos, eliminar ENUM, renombrar

-- 1. Crear columnas temporales VARCHAR con nombres diferentes
ALTER TABLE atencion_paquete ADD COLUMN IF NOT EXISTS estado_varchar VARCHAR(20);
ALTER TABLE atencion_paquete ADD COLUMN IF NOT EXISTS tipo_problema_varchar VARCHAR(50);

-- 2. Copiar datos de las columnas ENUM a las nuevas columnas VARCHAR
UPDATE atencion_paquete SET estado_varchar = estado::text WHERE estado IS NOT NULL;
UPDATE atencion_paquete SET tipo_problema_varchar = tipo_problema::text WHERE tipo_problema IS NOT NULL;

-- 3. Si no había datos, establecer valor por defecto para estado
UPDATE atencion_paquete SET estado_varchar = 'PENDIENTE' WHERE estado_varchar IS NULL;

-- 4. Eliminar las columnas ENUM originales (esto permite eliminar los tipos después)
ALTER TABLE atencion_paquete DROP COLUMN IF EXISTS estado;
ALTER TABLE atencion_paquete DROP COLUMN IF EXISTS tipo_problema;

-- 5. Renombrar las columnas temporales a los nombres originales
ALTER TABLE atencion_paquete RENAME COLUMN estado_varchar TO estado;
ALTER TABLE atencion_paquete RENAME COLUMN tipo_problema_varchar TO tipo_problema;

-- 6. Añadir NOT NULL a estado y tipo_problema
ALTER TABLE atencion_paquete ALTER COLUMN estado SET NOT NULL;
ALTER TABLE atencion_paquete ALTER COLUMN tipo_problema SET NOT NULL;

-- 7. Añadir restricciones CHECK
ALTER TABLE atencion_paquete ADD CONSTRAINT chk_estado_atencion_enum
    CHECK (estado IN ('PENDIENTE', 'EN_REVISION', 'RESUELTO', 'CANCELADO'));

ALTER TABLE atencion_paquete ADD CONSTRAINT chk_tipo_problema_atencion_enum
    CHECK (tipo_problema IN ('FALTA_INFORMACION', 'DATOS_INCOMPLETOS', 'ERROR_ENVIO', 'OTRO'));

-- 8. Eliminar los tipos ENUM (ahora ya no hay dependencias)
DROP TYPE IF EXISTS estado_atencion_enum;
DROP TYPE IF EXISTS tipo_problema_atencion_enum;
