-- Script para eliminar todos los paquetes registrados
-- Este script elimina todos los datos de paquetes para permitir ingresar datos reales
-- IMPORTANTE: Esta operación es irreversible

-- Paso 1: Eliminar todas las atenciones de paquetes (tiene FK con ON DELETE RESTRICT)
DELETE FROM atencion_paquete;

-- Paso 2: Actualizar los paquetes hijos para eliminar la referencia al padre
-- Esto evita problemas con la FK recursiva id_paquete_padre y los check constraints
-- Primero actualizamos los paquetes hijos que tienen tipo_paquete = SEPARAR
UPDATE paquete 
SET id_paquete_padre = NULL 
WHERE id_paquete_padre IS NOT NULL;

-- Paso 3: Eliminar todos los paquetes
-- Las relaciones con otras tablas (saca, lote_recepcion, etc.) son nullable,
-- por lo que se pueden eliminar sin problemas
-- Las FKs con ON DELETE RESTRICT de otras tablas (cliente, agencia, etc.) no impiden
-- la eliminación porque son referencias desde paquete hacia esas tablas, no al revés
DELETE FROM paquete;

-- Verificar que se eliminaron todos los paquetes
DO $$
DECLARE
    paquetes_restantes INTEGER;
    atenciones_restantes INTEGER;
BEGIN
    SELECT COUNT(*) INTO paquetes_restantes FROM paquete;
    SELECT COUNT(*) INTO atenciones_restantes FROM atencion_paquete;
    
    IF paquetes_restantes > 0 THEN
        RAISE EXCEPTION 'Aún quedan % paquetes en la base de datos', paquetes_restantes;
    END IF;
    
    IF atenciones_restantes > 0 THEN
        RAISE EXCEPTION 'Aún quedan % atenciones de paquetes en la base de datos', atenciones_restantes;
    END IF;
    
    RAISE NOTICE 'Todos los paquetes y atenciones han sido eliminados correctamente';
END $$;
