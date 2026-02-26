-- Índices para optimizar consultas de porcentaje de completado de recepciones
CREATE INDEX idx_paquete_recepcion_estado ON paquete(id_recepcion, estado) WHERE id_recepcion IS NOT NULL;

-- Índice adicional para búsquedas por número de guía (usado en importación)
CREATE INDEX idx_paquete_numero_guia_lookup ON paquete(numero_guia) WHERE numero_guia IS NOT NULL;
