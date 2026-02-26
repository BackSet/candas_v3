-- Permitir varias filas por numero_guia (una por etiqueta). Unique compuesta (numero_guia, etiqueta).
-- Las etiquetas son solo reales (MIA, GEO, etc.); no usar "PREGUNTAR" como valor de etiqueta.

-- Migrar filas con etiqueta='PREGUNTAR' a SIN_ASIGNAR para no perder datos
UPDATE lista_etiqueta_guia SET etiqueta = 'SIN_ASIGNAR' WHERE UPPER(TRIM(etiqueta)) = 'PREGUNTAR';

-- Eliminar restricción UNIQUE solo en numero_guia (PostgreSQL suele nombrarla tabla_columna_key)
ALTER TABLE lista_etiqueta_guia DROP CONSTRAINT IF EXISTS lista_etiqueta_guia_numero_guia_key;
ALTER TABLE lista_etiqueta_guia DROP CONSTRAINT IF EXISTS uk_lista_etiqueta_guia_numero_guia;

-- Añadir unique compuesta (numero_guia, etiqueta)
ALTER TABLE lista_etiqueta_guia ADD CONSTRAINT uk_lista_etiqueta_guia_numero_guia_etiqueta UNIQUE (numero_guia, etiqueta);
