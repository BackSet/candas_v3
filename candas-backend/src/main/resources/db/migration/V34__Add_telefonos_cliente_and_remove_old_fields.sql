-- Crear tabla telefono_cliente
CREATE TABLE IF NOT EXISTS telefono_cliente (
    id_telefono BIGSERIAL PRIMARY KEY,
    id_cliente BIGINT NOT NULL,
    numero VARCHAR(20) NOT NULL,
    principal BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_telefono_cliente_cliente FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente) ON DELETE CASCADE
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_telefono_cliente_cliente ON telefono_cliente(id_cliente);
CREATE INDEX IF NOT EXISTS idx_telefono_cliente_principal ON telefono_cliente(id_cliente, principal) WHERE principal = TRUE;

-- Migrar datos del campo telefono a la nueva tabla (si existen)
INSERT INTO telefono_cliente (id_cliente, numero, principal, fecha_registro)
SELECT 
    id_cliente,
    telefono,
    TRUE, -- Marcar como principal
    CURRENT_TIMESTAMP
FROM cliente
WHERE telefono IS NOT NULL AND telefono != '';

-- Eliminar el campo telefono de la tabla cliente
ALTER TABLE cliente DROP COLUMN IF EXISTS telefono;

-- Eliminar el campo direccion de la tabla cliente (ya que ahora solo usamos direcciones)
ALTER TABLE cliente DROP COLUMN IF EXISTS direccion;
