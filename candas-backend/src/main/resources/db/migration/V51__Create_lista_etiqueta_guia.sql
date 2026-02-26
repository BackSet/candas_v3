-- Migración V51: Crear tabla para etiquetado de números de guía
-- Esta tabla permite asignar etiquetas (ej: GEO, MIA) a números de guía
-- independientemente de si los paquetes existen en el sistema

CREATE TABLE IF NOT EXISTS lista_etiqueta_guia (
    id_lista_etiqueta_guia BIGSERIAL PRIMARY KEY,
    numero_guia VARCHAR(100) NOT NULL UNIQUE,
    etiqueta VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_lista_etiqueta_guia_etiqueta ON lista_etiqueta_guia(etiqueta);
CREATE INDEX IF NOT EXISTS idx_lista_etiqueta_guia_activo ON lista_etiqueta_guia(activo);
CREATE INDEX IF NOT EXISTS idx_lista_etiqueta_guia_numero_guia ON lista_etiqueta_guia(numero_guia);

-- Comentarios para documentación
COMMENT ON TABLE lista_etiqueta_guia IS 'Tabla para almacenar etiquetas asignadas a números de guía. Permite clasificar guías con etiquetas personalizadas (ej: GEO, MIA) independientemente de si los paquetes existen en el sistema.';
COMMENT ON COLUMN lista_etiqueta_guia.id_lista_etiqueta_guia IS 'Identificador único de la asignación';
COMMENT ON COLUMN lista_etiqueta_guia.numero_guia IS 'Número de guía único al que se le asigna la etiqueta';
COMMENT ON COLUMN lista_etiqueta_guia.etiqueta IS 'Etiqueta asignada al número de guía (ej: GEO, MIA)';
COMMENT ON COLUMN lista_etiqueta_guia.fecha_creacion IS 'Fecha y hora en que se creó la asignación';
COMMENT ON COLUMN lista_etiqueta_guia.fecha_actualizacion IS 'Fecha y hora de la última actualización';
COMMENT ON COLUMN lista_etiqueta_guia.activo IS 'Indica si la asignación está activa';
