-- Sesión de ensacado por usuario: último paquete buscado/ensacado para vista móvil
CREATE TABLE ensacado_sesion (
    id_usuario BIGINT NOT NULL PRIMARY KEY,
    id_paquete BIGINT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ensacado_sesion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_ensacado_sesion_paquete FOREIGN KEY (id_paquete) REFERENCES paquete(id_paquete) ON DELETE SET NULL
);

CREATE INDEX idx_ensacado_sesion_updated_at ON ensacado_sesion(updated_at);
