-- Migración para cambiar tamano_saca_enum a VARCHAR
-- Sigue el mismo patrón que V7__Change_paquete_enums_to_varchar.sql

-- 1. Crear columna temporal VARCHAR con nombre diferente
ALTER TABLE saca ADD COLUMN IF NOT EXISTS tamano_varchar VARCHAR(20);

-- 2. Copiar datos de la columna ENUM a la nueva columna VARCHAR
UPDATE saca SET tamano_varchar = tamano::text WHERE tamano IS NOT NULL;

-- 3. Si no había datos, establecer valor por defecto
UPDATE saca SET tamano_varchar = 'PEQUENO' WHERE tamano_varchar IS NULL;

-- 4. Eliminar la columna ENUM original (esto permite eliminar el tipo después)
ALTER TABLE saca DROP COLUMN IF EXISTS tamano;

-- 5. Renombrar la columna temporal al nombre original
ALTER TABLE saca RENAME COLUMN tamano_varchar TO tamano;

-- 6. Añadir NOT NULL
ALTER TABLE saca ALTER COLUMN tamano SET NOT NULL;

-- 7. Añadir restricción CHECK
ALTER TABLE saca ADD CONSTRAINT chk_tamano_saca_enum
    CHECK (tamano IN ('INDIVIDUAL', 'PEQUENO', 'MEDIANO', 'GRANDE'));

-- 8. Eliminar el tipo ENUM (ahora ya no hay dependencias)
DROP TYPE IF EXISTS tamano_saca_enum;
