-- Permite crear paquetes especiales (MIAMI/GEO) y simplificados sin cliente remitente.
-- Mantiene la FK existente, pero hace opcional el campo id_cliente_remitente.
ALTER TABLE paquete
    ALTER COLUMN id_cliente_remitente DROP NOT NULL;
