-- Garantizar que el usuario "backset" tenga rol ADMIN activo y que ADMIN tenga todos los permisos

-- Asegurar rol ADMIN existe y está activo
INSERT INTO rol (nombre, descripcion, activo, fecha_creacion)
SELECT 'ADMIN', 'Administrador del sistema con acceso completo', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'ADMIN');

UPDATE rol
SET activo = TRUE
WHERE nombre = 'ADMIN';

-- Asegurar usuario backset existe (password bcrypt tomado del export CSV)
INSERT INTO usuario (
    username,
    email,
    password,
    nombre_completo,
    activo,
    cuenta_no_expirada,
    cuenta_no_bloqueada,
    credenciales_no_expiradas,
    fecha_registro,
    ultimo_acceso,
    id_cliente
)
SELECT
    'backset',
    'cris.medina.morocho@gmail.com',
    '$2a$10$B/zYhS50FvUKKUyNmkC4WeukY1b78T0csBREHAvq0v1VnMcCalH0O',
    'Cristian Eduardo Medina Morocho',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    NULL,
    NULL
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'backset');

-- Asegurar que backset esté habilitado (por si fue desactivado)
UPDATE usuario
SET
    activo = TRUE,
    cuenta_no_expirada = TRUE,
    cuenta_no_bloqueada = TRUE,
    credenciales_no_expiradas = TRUE
WHERE username = 'backset';

-- Asignar rol ADMIN al usuario backset (y asegurar que esté activo)
INSERT INTO usuario_rol (id_usuario, id_rol, fecha_asignacion, activo)
SELECT
    u.id_usuario,
    r.id_rol,
    CURRENT_TIMESTAMP,
    TRUE
FROM usuario u
CROSS JOIN rol r
WHERE u.username = 'backset'
  AND r.nombre = 'ADMIN'
ON CONFLICT (id_usuario, id_rol)
DO UPDATE SET
    activo = TRUE,
    fecha_asignacion = CURRENT_TIMESTAMP;

-- Asegurar que ADMIN tenga TODOS los permisos existentes
INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT r.id_rol, p.id_permiso, CURRENT_TIMESTAMP
FROM rol r
CROSS JOIN permiso p
WHERE r.nombre = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM rol_permiso rp
    WHERE rp.id_rol = r.id_rol AND rp.id_permiso = p.id_permiso
  );

