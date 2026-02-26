-- Cambiar la columna tipo de tipo_cliente_enum a VARCHAR con CHECK constraint
-- Esto resuelve problemas de compatibilidad entre Hibernate y PostgreSQL ENUMs personalizados

-- Cambiar el tipo de la columna de tipo_cliente_enum a VARCHAR
ALTER TABLE cliente 
ALTER COLUMN tipo TYPE VARCHAR(20) USING tipo::text;

-- Agregar constraint para validar los valores permitidos
ALTER TABLE cliente
ADD CONSTRAINT check_tipo_cliente CHECK (tipo IN ('REMITENTE', 'DESTINATARIO', 'AMBOS'));
