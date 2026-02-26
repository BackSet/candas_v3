-- Migración V52: Crear tablas para grupos personalizados de paquetes en lotes de recepción
-- Esta funcionalidad permite crear grupos personalizados de paquetes con nombre y descripción
-- que persisten en la base de datos y se pueden visualizar al volver al detalle del lote

CREATE TABLE IF NOT EXISTS grupo_personalizado (
    id_grupo_personalizado BIGSERIAL PRIMARY KEY,
    id_lote_recepcion BIGINT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_grupo_personalizado_lote_recepcion 
        FOREIGN KEY (id_lote_recepcion) 
        REFERENCES lote_recepcion(id_lote_recepcion) 
        ON DELETE CASCADE
);

-- Tabla intermedia para la relación Many-to-Many entre grupos personalizados y paquetes
CREATE TABLE IF NOT EXISTS grupo_personalizado_paquete (
    id_grupo_personalizado BIGINT NOT NULL,
    id_paquete BIGINT NOT NULL,
    CONSTRAINT pk_grupo_personalizado_paquete 
        PRIMARY KEY (id_grupo_personalizado, id_paquete),
    CONSTRAINT fk_grupo_personalizado_paquete_grupo 
        FOREIGN KEY (id_grupo_personalizado) 
        REFERENCES grupo_personalizado(id_grupo_personalizado) 
        ON DELETE CASCADE,
    CONSTRAINT fk_grupo_personalizado_paquete_paquete 
        FOREIGN KEY (id_paquete) 
        REFERENCES paquete(id_paquete) 
        ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_grupo_personalizado_lote_recepcion 
    ON grupo_personalizado(id_lote_recepcion);
CREATE INDEX IF NOT EXISTS idx_grupo_personalizado_activo 
    ON grupo_personalizado(activo);
CREATE INDEX IF NOT EXISTS idx_grupo_personalizado_paquete_grupo 
    ON grupo_personalizado_paquete(id_grupo_personalizado);
CREATE INDEX IF NOT EXISTS idx_grupo_personalizado_paquete_paquete 
    ON grupo_personalizado_paquete(id_paquete);

-- Comentarios para documentación
COMMENT ON TABLE grupo_personalizado IS 'Tabla para almacenar grupos personalizados de paquetes en lotes de recepción. Permite crear grupos con nombre y descripción que persisten en la base de datos.';
COMMENT ON TABLE grupo_personalizado_paquete IS 'Tabla intermedia para la relación Many-to-Many entre grupos personalizados y paquetes. Un paquete puede pertenecer a múltiples grupos.';
COMMENT ON COLUMN grupo_personalizado.id_grupo_personalizado IS 'Identificador único del grupo personalizado';
COMMENT ON COLUMN grupo_personalizado.id_lote_recepcion IS 'ID del lote de recepción al que pertenece el grupo';
COMMENT ON COLUMN grupo_personalizado.nombre IS 'Nombre del grupo personalizado';
COMMENT ON COLUMN grupo_personalizado.descripcion IS 'Descripción opcional del grupo';
COMMENT ON COLUMN grupo_personalizado.fecha_creacion IS 'Fecha y hora en que se creó el grupo';
COMMENT ON COLUMN grupo_personalizado.fecha_actualizacion IS 'Fecha y hora de la última actualización';
COMMENT ON COLUMN grupo_personalizado.activo IS 'Indica si el grupo está activo (soft delete)';
