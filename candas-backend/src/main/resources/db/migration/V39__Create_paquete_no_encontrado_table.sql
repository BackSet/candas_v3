-- Migración V39: Crear tabla para almacenar números de guía no encontrados en lotes de recepción

CREATE TABLE IF NOT EXISTS paquete_no_encontrado (
    id_paquete_no_encontrado BIGSERIAL PRIMARY KEY,
    id_lote_recepcion BIGINT NOT NULL,
    numero_guia VARCHAR(100) NOT NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_registro VARCHAR(255) NOT NULL,
    CONSTRAINT fk_paquete_no_encontrado_lote_recepcion 
        FOREIGN KEY (id_lote_recepcion) 
        REFERENCES lote_recepcion(id_lote_recepcion) 
        ON DELETE CASCADE
);

-- Índice para búsquedas por lote de recepción
CREATE INDEX IF NOT EXISTS idx_paquete_no_encontrado_lote_recepcion 
    ON paquete_no_encontrado(id_lote_recepcion);

-- Índice para búsquedas por número de guía
CREATE INDEX IF NOT EXISTS idx_paquete_no_encontrado_numero_guia 
    ON paquete_no_encontrado(numero_guia);
