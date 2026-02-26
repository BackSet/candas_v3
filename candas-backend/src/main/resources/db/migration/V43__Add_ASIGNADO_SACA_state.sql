-- Migración V43: Agregar estado ASIGNADO_SACA para paquetes
-- Este estado indica que un paquete está asignado a una saca pero aún no ha sido ensacado físicamente

-- 1. Actualizar el CHECK constraint para incluir el nuevo estado ASIGNADO_SACA
ALTER TABLE paquete DROP CONSTRAINT IF EXISTS chk_estado_paquete_enum;

ALTER TABLE paquete ADD CONSTRAINT chk_estado_paquete_enum
    CHECK (estado IN ('REGISTRADO', 'RECIBIDO', 'ASIGNADO_SACA', 'ENSACADO', 'DESPACHADO'));

-- 2. Migrar datos existentes: 
--    Los paquetes que están en estado ENSACADO pero no tienen fecha_ensacado
--    o tienen fecha_ensacado muy reciente (probablemente solo fueron asignados, no ensacados físicamente)
--    se cambiarán a ASIGNADO_SACA
--    
--    Estrategia conservadora:
--    - Si tiene fecha_ensacado y es anterior a hace 1 hora → mantener ENSACADO (probablemente ensacado físicamente)
--    - Si no tiene fecha_ensacado o es muy reciente → cambiar a ASIGNADO_SACA (probablemente solo asignado)

UPDATE paquete
SET estado = 'ASIGNADO_SACA'
WHERE estado = 'ENSACADO'
  AND (
    fecha_ensacado IS NULL
    OR fecha_ensacado > (CURRENT_TIMESTAMP - INTERVAL '1 hour')
  );

-- 3. Verificar la migración
DO $$
DECLARE
    paquetes_migrados INTEGER;
    paquetes_ensacados INTEGER;
BEGIN
    SELECT COUNT(*) INTO paquetes_migrados 
    FROM paquete 
    WHERE estado = 'ASIGNADO_SACA';
    
    SELECT COUNT(*) INTO paquetes_ensacados 
    FROM paquete 
    WHERE estado = 'ENSACADO';
    
    RAISE NOTICE 'Migración completada: % paquetes en ASIGNADO_SACA, % paquetes en ENSACADO', 
        paquetes_migrados, paquetes_ensacados;
END $$;
