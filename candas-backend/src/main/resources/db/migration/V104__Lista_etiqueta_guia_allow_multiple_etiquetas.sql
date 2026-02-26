-- Permitir la misma guía en varias etiquetas: UNIQUE (numero_guia, etiqueta).
-- Idempotente: elimina UNIQUE solo en numero_guia y asegura la compuesta.

-- Eliminar restricción UNIQUE solo en numero_guia (nombres posibles en PostgreSQL)
ALTER TABLE lista_etiqueta_guia DROP CONSTRAINT IF EXISTS lista_etiqueta_guia_numero_guia_key;
ALTER TABLE lista_etiqueta_guia DROP CONSTRAINT IF EXISTS uk_lista_etiqueta_guia_numero_guia;

-- Añadir unique compuesta si no existe (evitar error si V102 ya la aplicó)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uk_lista_etiqueta_guia_numero_guia_etiqueta'
    AND conrelid = 'lista_etiqueta_guia'::regclass
  ) THEN
    ALTER TABLE lista_etiqueta_guia
      ADD CONSTRAINT uk_lista_etiqueta_guia_numero_guia_etiqueta UNIQUE (numero_guia, etiqueta);
  END IF;
END $$;
