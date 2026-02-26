-- Tabla USUARIO
CREATE TABLE usuario (
    id_usuario BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    cuenta_no_expirada BOOLEAN NOT NULL DEFAULT TRUE,
    cuenta_no_bloqueada BOOLEAN NOT NULL DEFAULT TRUE,
    credenciales_no_expiradas BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    id_cliente BIGINT,
    CONSTRAINT fk_usuario_cliente FOREIGN KEY (id_cliente) 
        REFERENCES cliente(id_cliente) ON DELETE SET NULL
);

-- Tabla ROL
CREATE TABLE rol (
    id_rol BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla PERMISO
CREATE TABLE permiso (
    id_permiso BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    recurso VARCHAR(100),
    accion VARCHAR(50)
);

-- Tabla USUARIO_ROL (relación muchos-a-muchos)
CREATE TABLE usuario_rol (
    id_usuario_rol BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL,
    id_rol BIGINT NOT NULL,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_usuario_rol_usuario FOREIGN KEY (id_usuario) 
        REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_rol_rol FOREIGN KEY (id_rol) 
        REFERENCES rol(id_rol) ON DELETE CASCADE,
    CONSTRAINT uk_usuario_rol UNIQUE (id_usuario, id_rol)
);

-- Tabla ROL_PERMISO (relación muchos-a-muchos)
CREATE TABLE rol_permiso (
    id_rol_permiso BIGSERIAL PRIMARY KEY,
    id_rol BIGINT NOT NULL,
    id_permiso BIGINT NOT NULL,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rol_permiso_rol FOREIGN KEY (id_rol) 
        REFERENCES rol(id_rol) ON DELETE CASCADE,
    CONSTRAINT fk_rol_permiso_permiso FOREIGN KEY (id_permiso) 
        REFERENCES permiso(id_permiso) ON DELETE CASCADE,
    CONSTRAINT uk_rol_permiso UNIQUE (id_rol, id_permiso)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_usuario_username ON usuario(username);
CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_usuario_id_cliente ON usuario(id_cliente);
CREATE INDEX idx_usuario_activo ON usuario(activo);
CREATE INDEX idx_rol_nombre ON rol(nombre);
CREATE INDEX idx_rol_activo ON rol(activo);
CREATE INDEX idx_permiso_nombre ON permiso(nombre);
CREATE INDEX idx_permiso_recurso ON permiso(recurso);
CREATE INDEX idx_usuario_rol_id_usuario ON usuario_rol(id_usuario);
CREATE INDEX idx_usuario_rol_id_rol ON usuario_rol(id_rol);
CREATE INDEX idx_usuario_rol_activo ON usuario_rol(id_usuario, activo) WHERE activo = TRUE;
CREATE INDEX idx_rol_permiso_id_rol ON rol_permiso(id_rol);
CREATE INDEX idx_rol_permiso_id_permiso ON rol_permiso(id_permiso);

-- Insertar roles predefinidos
INSERT INTO rol (nombre, descripcion, activo, fecha_creacion) VALUES
('ADMIN', 'Administrador del sistema con acceso completo', TRUE, CURRENT_TIMESTAMP),
('OPERARIO', 'Operario que puede registrar paquetes, crear recepciones, ensacar y crear despachos', TRUE, CURRENT_TIMESTAMP),
('SUPERVISOR', 'Supervisor que puede ver reportes, gestionar atención de paquetes y supervisar operaciones', TRUE, CURRENT_TIMESTAMP),
('CLIENTE', 'Cliente que puede consultar sus propios paquetes y realizar solicitudes', TRUE, CURRENT_TIMESTAMP),
('AUDITOR', 'Auditor con acceso de solo lectura para ver reportes y auditorías', TRUE, CURRENT_TIMESTAMP);

-- Insertar permisos predefinidos (ejemplos)
INSERT INTO permiso (nombre, descripcion, recurso, accion) VALUES
-- Permisos de PAQUETE
('CREAR_PAQUETE', 'Permite crear nuevos paquetes', 'PAQUETE', 'CREATE'),
('LEER_PAQUETE', 'Permite leer información de paquetes', 'PAQUETE', 'READ'),
('ACTUALIZAR_PAQUETE', 'Permite actualizar información de paquetes', 'PAQUETE', 'UPDATE'),
('ELIMINAR_PAQUETE', 'Permite eliminar paquetes', 'PAQUETE', 'DELETE'),
('SEPARAR_PAQUETE', 'Permite separar paquetes consolidados', 'PAQUETE', 'SEPARAR'),
-- Permisos de RECEPCION
('CREAR_RECEPCION', 'Permite crear nuevas recepciones', 'RECEPCION', 'CREATE'),
('LEER_RECEPCION', 'Permite leer información de recepciones', 'RECEPCION', 'READ'),
('ACTUALIZAR_RECEPCION', 'Permite actualizar información de recepciones', 'RECEPCION', 'UPDATE'),
-- Permisos de DESPACHO
('CREAR_DESPACHO', 'Permite crear nuevos despachos', 'DESPACHO', 'CREATE'),
('LEER_DESPACHO', 'Permite leer información de despachos', 'DESPACHO', 'READ'),
('GENERAR_MANIFIESTO', 'Permite generar manifiestos de despacho', 'DESPACHO', 'GENERAR_MANIFIESTO'),
-- Permisos de SACA
('CREAR_SACA', 'Permite crear nuevas sacas', 'SACA', 'CREATE'),
('LEER_SACA', 'Permite leer información de sacas', 'SACA', 'READ'),
('ENSACAR_PAQUETE', 'Permite ensacar paquetes en sacas', 'SACA', 'ENSACAR'),
-- Permisos de ATENCION
('CREAR_ATENCION', 'Permite crear solicitudes de atención', 'ATENCION', 'CREATE'),
('RESOLVER_ATENCION', 'Permite resolver solicitudes de atención', 'ATENCION', 'RESOLVER'),
('LEER_ATENCION', 'Permite leer información de solicitudes de atención', 'ATENCION', 'READ'),
-- Permisos de REPORTES
('VER_REPORTES', 'Permite ver reportes del sistema', 'REPORTES', 'READ'),
('EXPORTAR_REPORTES', 'Permite exportar reportes', 'REPORTES', 'EXPORTAR'),
-- Permisos de USUARIOS
('GESTIONAR_USUARIOS', 'Permite gestionar usuarios del sistema', 'USUARIOS', 'MANAGE'),
('ASIGNAR_ROLES', 'Permite asignar roles a usuarios', 'USUARIOS', 'ASIGNAR_ROLES'),
-- Permisos de ROLES
('GESTIONAR_ROLES', 'Permite gestionar roles del sistema', 'ROLES', 'MANAGE'),
('ASIGNAR_PERMISOS', 'Permite asignar permisos a roles', 'ROLES', 'ASIGNAR_PERMISOS');

