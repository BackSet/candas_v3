-- Reintroducir módulo de Grupos (usuarios/roles/permisos por grupo)
-- Nota: estas tablas fueron eliminadas en V38 (RBAC puro), pero el frontend
-- y el modelo actual requieren Grupos nuevamente.

-- Tabla GRUPO
CREATE TABLE IF NOT EXISTS grupo (
    id_grupo BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP
);

-- Tabla USUARIO_GRUPO (relación muchos-a-muchos con soft delete)
CREATE TABLE IF NOT EXISTS usuario_grupo (
    id_usuario_grupo BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL,
    id_grupo BIGINT NOT NULL,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_usuario_grupo_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_grupo_grupo FOREIGN KEY (id_grupo)
        REFERENCES grupo(id_grupo) ON DELETE CASCADE,
    CONSTRAINT uk_usuario_grupo UNIQUE (id_usuario, id_grupo)
);

-- Tabla ROL_GRUPO (relación muchos-a-muchos con soft delete)
CREATE TABLE IF NOT EXISTS rol_grupo (
    id_rol_grupo BIGSERIAL PRIMARY KEY,
    id_rol BIGINT NOT NULL,
    id_grupo BIGINT NOT NULL,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_rol_grupo_rol FOREIGN KEY (id_rol)
        REFERENCES rol(id_rol) ON DELETE CASCADE,
    CONSTRAINT fk_rol_grupo_grupo FOREIGN KEY (id_grupo)
        REFERENCES grupo(id_grupo) ON DELETE CASCADE,
    CONSTRAINT uk_rol_grupo UNIQUE (id_rol, id_grupo)
);

-- Tabla GRUPO_PERMISO (relación muchos-a-muchos con soft delete)
CREATE TABLE IF NOT EXISTS grupo_permiso (
    id_grupo_permiso BIGSERIAL PRIMARY KEY,
    id_grupo BIGINT NOT NULL,
    id_permiso BIGINT NOT NULL,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_grupo_permiso_grupo FOREIGN KEY (id_grupo)
        REFERENCES grupo(id_grupo) ON DELETE CASCADE,
    CONSTRAINT fk_grupo_permiso_permiso FOREIGN KEY (id_permiso)
        REFERENCES permiso(id_permiso) ON DELETE CASCADE,
    CONSTRAINT uk_grupo_permiso UNIQUE (id_grupo, id_permiso)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_grupo_nombre ON grupo(nombre);
CREATE INDEX IF NOT EXISTS idx_grupo_activo ON grupo(activo);

CREATE INDEX IF NOT EXISTS idx_usuario_grupo_id_usuario ON usuario_grupo(id_usuario);
CREATE INDEX IF NOT EXISTS idx_usuario_grupo_id_grupo ON usuario_grupo(id_grupo);
CREATE INDEX IF NOT EXISTS idx_usuario_grupo_activo ON usuario_grupo(id_usuario, activo) WHERE activo = TRUE;

CREATE INDEX IF NOT EXISTS idx_rol_grupo_id_rol ON rol_grupo(id_rol);
CREATE INDEX IF NOT EXISTS idx_rol_grupo_id_grupo ON rol_grupo(id_grupo);
CREATE INDEX IF NOT EXISTS idx_rol_grupo_activo ON rol_grupo(id_rol, activo) WHERE activo = TRUE;

CREATE INDEX IF NOT EXISTS idx_grupo_permiso_id_grupo ON grupo_permiso(id_grupo);
CREATE INDEX IF NOT EXISTS idx_grupo_permiso_id_permiso ON grupo_permiso(id_permiso);
CREATE INDEX IF NOT EXISTS idx_grupo_permiso_activo ON grupo_permiso(id_grupo, activo) WHERE activo = TRUE;

