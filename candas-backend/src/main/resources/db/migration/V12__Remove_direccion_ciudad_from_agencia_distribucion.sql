-- V12__Remove_direccion_ciudad_from_agencia_distribucion.sql

-- Eliminar las columnas direccion y ciudad de agencia_distribucion
ALTER TABLE agencia_distribucion
    DROP COLUMN IF EXISTS direccion,
    DROP COLUMN IF EXISTS ciudad;
