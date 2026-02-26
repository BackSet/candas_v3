-- Tabla USUARIO_PERMISO (relación muchos-a-muchos)
CREATE TABLE usuario_permiso (
    id_usuario_permiso BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL,
    id_permiso BIGINT NOT NULL,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_permiso_usuario FOREIGN KEY (id_usuario) 
        REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_permiso_permiso FOREIGN KEY (id_permiso) 
        REFERENCES permiso(id_permiso) ON DELETE CASCADE,
    CONSTRAINT uk_usuario_permiso UNIQUE (id_usuario, id_permiso)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_usuario_permiso_id_usuario ON usuario_permiso(id_usuario);
CREATE INDEX idx_usuario_permiso_id_permiso ON usuario_permiso(id_permiso);
