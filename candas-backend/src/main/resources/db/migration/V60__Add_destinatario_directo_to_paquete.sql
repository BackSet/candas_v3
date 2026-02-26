-- Migración V60: Asociar paquete a destinatario_directo (opcional)
-- Permite asignar un destinatario directo a un paquete cuando TipoDestino es DOMICILIO

ALTER TABLE paquete
ADD COLUMN IF NOT EXISTS id_destinatario_directo BIGINT;

-- PostgreSQL no soporta: ADD CONSTRAINT IF NOT EXISTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_paquete_destinatario_directo'
  ) THEN
    ALTER TABLE paquete
    ADD CONSTRAINT fk_paquete_destinatario_directo
    FOREIGN KEY (id_destinatario_directo)
    REFERENCES destinatario_directo(id_destinatario_directo)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_paquete_destinatario_directo
ON paquete(id_destinatario_directo);

