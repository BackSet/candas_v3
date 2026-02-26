-- Añadir fecha de envío para estado ENVIADO en lista_etiqueta_guia
ALTER TABLE lista_etiqueta_guia ADD COLUMN IF NOT EXISTS fecha_envio TIMESTAMP;
