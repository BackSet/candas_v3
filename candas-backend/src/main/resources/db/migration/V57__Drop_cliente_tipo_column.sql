-- Eliminar completamente el tipo de cliente del modelo (sin migrar datos)
-- - Quitar constraint de V5 si existe
-- - Quitar columna cliente.tipo
-- - Quitar el TYPE legado si aún existe (de V1)

ALTER TABLE cliente DROP CONSTRAINT IF EXISTS check_tipo_cliente;
ALTER TABLE cliente DROP COLUMN IF EXISTS tipo;

-- En instalaciones antiguas, este TYPE pudo quedar sin uso tras convertir a VARCHAR (V5)
DROP TYPE IF EXISTS tipo_cliente_enum;

