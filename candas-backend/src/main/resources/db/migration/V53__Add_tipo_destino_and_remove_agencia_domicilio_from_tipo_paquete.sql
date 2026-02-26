-- Agregar columna tipo_destino a la tabla paquete
ALTER TABLE paquete ADD COLUMN tipo_destino VARCHAR(20);

-- Migrar datos existentes: asignar tipo_destino basándose en tipo_paquete
UPDATE paquete SET tipo_destino = 'AGENCIA' WHERE tipo_paquete = 'AGENCIA';
UPDATE paquete SET tipo_destino = 'DOMICILIO' WHERE tipo_paquete = 'DOMICILIO';

-- Establecer tipo_paquete a NULL para paquetes que eran AGENCIA o DOMICILIO
-- (ya que estos no son realmente tipos de paquete, sino destinos)
UPDATE paquete SET tipo_paquete = NULL WHERE tipo_paquete IN ('AGENCIA', 'DOMICILIO');

-- Eliminar el constraint antiguo chk_agencia_destino
ALTER TABLE paquete DROP CONSTRAINT IF EXISTS chk_agencia_destino;

-- Verificar y corregir datos inconsistentes antes de crear el nuevo constraint
-- Si hay paquetes con tipo_destino = 'AGENCIA' pero sin id_agencia_destino,
-- establecer tipo_destino a NULL (ya que no pueden tener destino AGENCIA sin agencia)
UPDATE paquete SET tipo_destino = NULL WHERE tipo_destino = 'AGENCIA' AND id_agencia_destino IS NULL;

-- Crear nuevo constraint que valida id_agencia_destino basándose en tipo_destino
ALTER TABLE paquete ADD CONSTRAINT chk_agencia_destino CHECK (
    (tipo_destino = 'AGENCIA' AND id_agencia_destino IS NOT NULL) OR
    (tipo_destino != 'AGENCIA' OR tipo_destino IS NULL)
);
