-- V10__Remove_telefono_from_agencia.sql

-- Eliminar la columna telefono de la tabla agencia
-- Los datos ya fueron migrados a telefono_agencia en la migración V9
ALTER TABLE agencia DROP COLUMN IF EXISTS telefono;
