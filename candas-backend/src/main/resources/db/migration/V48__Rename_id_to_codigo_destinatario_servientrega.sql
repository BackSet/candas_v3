-- Migración V48: Renombrar columna id_destinatario_servientrega a codigo_destinatario_servientrega
-- Este cambio actualiza el nombre del campo para reflejar que es un código, no un ID

-- Renombrar la columna si existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'destinatario_directo' 
        AND column_name = 'id_destinatario_servientrega'
    ) THEN
        ALTER TABLE destinatario_directo 
        RENAME COLUMN id_destinatario_servientrega TO codigo_destinatario_servientrega;
    END IF;
END $$;
