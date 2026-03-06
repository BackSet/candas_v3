-- Migración V125: Tabla parámetros del sistema (clave-valor para configuraciones)
-- IF NOT EXISTS para permitir re-ejecución si la tabla ya existe (ej. creada manualmente o por ejecución previa).
-- Si Flyway marcó esta migración como fallida, ejecutar: flyway repair. Luego reiniciar la app.
CREATE TABLE IF NOT EXISTS parametro_sistema (
    id_parametro_sistema BIGSERIAL PRIMARY KEY,
    clave VARCHAR(100) NOT NULL,
    valor TEXT,
    CONSTRAINT uk_parametro_sistema_clave UNIQUE (clave)
);

-- Si la tabla ya existía sin la restricción única, añadirla (permite ON CONFLICT en el INSERT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uk_parametro_sistema_clave'
  ) THEN
    ALTER TABLE parametro_sistema ADD CONSTRAINT uk_parametro_sistema_clave UNIQUE (clave);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_parametro_sistema_clave ON parametro_sistema(clave);

-- Valor por defecto: plantilla WhatsApp para mensajes de despacho
INSERT INTO parametro_sistema (clave, valor) VALUES (
    'whatsapp_mensaje_despacho',
    'Despacho {{numero_manifiesto}}
Fecha: {{fecha_despacho}}
Agencia: {{agencia}}
Distribuidor: {{distribuidor}}
Guías: {{guias}}
Observaciones: {{observaciones}}'
)
ON CONFLICT (clave) DO NOTHING;
