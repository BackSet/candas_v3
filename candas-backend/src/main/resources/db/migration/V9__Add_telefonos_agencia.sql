-- V9__Add_telefonos_agencia.sql

-- Crear la tabla telefono_agencia
CREATE TABLE telefono_agencia (
    id_telefono BIGSERIAL PRIMARY KEY,
    id_agencia BIGINT NOT NULL,
    numero VARCHAR(255) NOT NULL,
    principal BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_agencia_telefono FOREIGN KEY (id_agencia) REFERENCES agencia(id_agencia) ON DELETE CASCADE
);

-- Migrar datos existentes de agencia.telefono a telefono_agencia
INSERT INTO telefono_agencia (id_agencia, numero, principal, fecha_registro)
SELECT
    a.id_agencia,
    a.telefono,
    TRUE, -- Marcar como principal por defecto para teléfonos migrados
    CURRENT_TIMESTAMP
FROM agencia a
WHERE a.telefono IS NOT NULL AND a.telefono != '';

-- Hacer la columna telefono nullable para compatibilidad (ya debería ser nullable, pero por si acaso)
ALTER TABLE agencia ALTER COLUMN telefono DROP NOT NULL;
