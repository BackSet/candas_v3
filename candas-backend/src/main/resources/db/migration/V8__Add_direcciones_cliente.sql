-- Crear tabla direccion_cliente
CREATE TABLE direccion_cliente (
    id_direccion BIGSERIAL PRIMARY KEY,
    id_cliente BIGINT NOT NULL,
    pais VARCHAR(255),
    ciudad VARCHAR(255),
    canton VARCHAR(255),
    direccion TEXT,
    principal BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_direccion_cliente FOREIGN KEY (id_cliente) 
        REFERENCES cliente(id_cliente) ON DELETE CASCADE
);

-- Migrar datos existentes de cliente.direccion a direccion_cliente
-- Si el cliente tiene una dirección, crear una dirección genérica con principal = true
INSERT INTO direccion_cliente (id_cliente, direccion, principal, fecha_registro)
SELECT 
    id_cliente,
    direccion,
    TRUE as principal,
    fecha_registro
FROM cliente
WHERE direccion IS NOT NULL AND direccion != '';

-- Agregar columnas a paquete para referenciar direcciones
ALTER TABLE paquete
ADD COLUMN IF NOT EXISTS id_direccion_remitente BIGINT,
ADD COLUMN IF NOT EXISTS id_direccion_destinatario BIGINT;

-- Agregar foreign keys
ALTER TABLE paquete
ADD CONSTRAINT fk_paquete_direccion_remitente 
    FOREIGN KEY (id_direccion_remitente) 
    REFERENCES direccion_cliente(id_direccion) 
    ON DELETE SET NULL;

ALTER TABLE paquete
ADD CONSTRAINT fk_paquete_direccion_destinatario 
    FOREIGN KEY (id_direccion_destinatario) 
    REFERENCES direccion_cliente(id_direccion) 
    ON DELETE SET NULL;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_direccion_cliente_cliente ON direccion_cliente(id_cliente);
CREATE INDEX IF NOT EXISTS idx_direccion_cliente_principal ON direccion_cliente(id_cliente, principal) WHERE principal = TRUE;
CREATE INDEX IF NOT EXISTS idx_paquete_direccion_remitente ON paquete(id_direccion_remitente);
CREATE INDEX IF NOT EXISTS idx_paquete_direccion_destinatario ON paquete(id_direccion_destinatario);
