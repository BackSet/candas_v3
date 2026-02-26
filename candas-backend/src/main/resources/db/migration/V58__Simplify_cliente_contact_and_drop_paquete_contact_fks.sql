-- Simplificar contacto/dirección de clientes:
-- - Cliente ahora guarda: pais, ciudad, canton, direccion, telefono
-- - Migrar desde direccion_cliente/telefono_cliente (principal o primero)
-- - Eliminar columnas/FKs en paquete y dropear tablas direccion_cliente/telefono_cliente

-- 1) Agregar columnas nuevas en cliente
ALTER TABLE cliente
  ADD COLUMN IF NOT EXISTS pais VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ciudad VARCHAR(255),
  ADD COLUMN IF NOT EXISTS canton VARCHAR(255),
  ADD COLUMN IF NOT EXISTS direccion TEXT,
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);

-- 2) Migrar dirección principal (o primera) hacia cliente
WITH dir AS (
  SELECT DISTINCT ON (id_cliente)
    id_cliente,
    pais,
    ciudad,
    canton,
    direccion
  FROM direccion_cliente
  ORDER BY id_cliente, principal DESC, id_direccion ASC
)
UPDATE cliente c
SET
  pais = COALESCE(c.pais, dir.pais),
  ciudad = COALESCE(c.ciudad, dir.ciudad),
  canton = COALESCE(c.canton, dir.canton),
  direccion = COALESCE(c.direccion, dir.direccion)
FROM dir
WHERE c.id_cliente = dir.id_cliente;

-- 3) Migrar teléfono principal (o primero) hacia cliente
WITH tel AS (
  SELECT DISTINCT ON (id_cliente)
    id_cliente,
    numero
  FROM telefono_cliente
  ORDER BY id_cliente, principal DESC, id_telefono ASC
)
UPDATE cliente c
SET telefono = COALESCE(c.telefono, tel.numero)
FROM tel
WHERE c.id_cliente = tel.id_cliente;

-- 4) Dropear constraints/índices y columnas en paquete
ALTER TABLE paquete DROP CONSTRAINT IF EXISTS fk_paquete_direccion_remitente;
ALTER TABLE paquete DROP CONSTRAINT IF EXISTS fk_paquete_direccion_destinatario;
ALTER TABLE paquete DROP CONSTRAINT IF EXISTS fk_paquete_telefono_destinatario;

DROP INDEX IF EXISTS idx_paquete_direccion_remitente;
DROP INDEX IF EXISTS idx_paquete_direccion_destinatario;
DROP INDEX IF EXISTS idx_paquete_telefono_destinatario;

ALTER TABLE paquete
  DROP COLUMN IF EXISTS id_direccion_remitente,
  DROP COLUMN IF EXISTS id_direccion_destinatario,
  DROP COLUMN IF EXISTS id_telefono_destinatario;

-- 5) Dropear tablas legacy
DROP TABLE IF EXISTS direccion_cliente;
DROP TABLE IF EXISTS telefono_cliente;

