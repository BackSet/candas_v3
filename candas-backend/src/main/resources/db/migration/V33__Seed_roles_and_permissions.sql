-- Migración V33: Seed de roles y permisos para gestión del sistema
-- Esta migración crea permisos específicos para gestión de usuarios, roles, grupos y permisos
-- y los asigna a los roles correspondientes

-- Insertar permisos de gestión de usuarios (si no existen)
INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'usuarios:crear', 'Permite crear nuevos usuarios', 'USUARIOS', 'CREATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'usuarios:crear');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'usuarios:editar', 'Permite editar usuarios existentes', 'USUARIOS', 'UPDATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'usuarios:editar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'usuarios:eliminar', 'Permite eliminar usuarios', 'USUARIOS', 'DELETE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'usuarios:eliminar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'usuarios:ver', 'Permite ver lista y detalles de usuarios', 'USUARIOS', 'READ'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'usuarios:ver');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'usuarios:asignar_roles', 'Permite asignar roles a usuarios', 'USUARIOS', 'ASIGNAR_ROLES'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'usuarios:asignar_roles');

-- Insertar permisos de gestión de roles (si no existen)
INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'roles:crear', 'Permite crear nuevos roles', 'ROLES', 'CREATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'roles:crear');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'roles:editar', 'Permite editar roles existentes', 'ROLES', 'UPDATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'roles:editar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'roles:eliminar', 'Permite eliminar roles', 'ROLES', 'DELETE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'roles:eliminar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'roles:ver', 'Permite ver lista y detalles de roles', 'ROLES', 'READ'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'roles:ver');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'roles:asignar_permisos', 'Permite asignar permisos a roles', 'ROLES', 'ASIGNAR_PERMISOS'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'roles:asignar_permisos');

-- Insertar permisos de gestión de grupos (si no existen)
INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'grupos:crear', 'Permite crear nuevos grupos', 'GRUPOS', 'CREATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'grupos:crear');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'grupos:editar', 'Permite editar grupos existentes', 'GRUPOS', 'UPDATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'grupos:editar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'grupos:eliminar', 'Permite eliminar grupos', 'GRUPOS', 'DELETE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'grupos:eliminar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'grupos:ver', 'Permite ver lista y detalles de grupos', 'GRUPOS', 'READ'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'grupos:ver');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'grupos:asignar_usuarios', 'Permite asignar usuarios a grupos', 'GRUPOS', 'ASIGNAR_USUARIOS'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'grupos:asignar_usuarios');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'grupos:asignar_roles', 'Permite asignar roles a grupos', 'GRUPOS', 'ASIGNAR_ROLES'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'grupos:asignar_roles');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'grupos:asignar_permisos', 'Permite asignar permisos a grupos', 'GRUPOS', 'ASIGNAR_PERMISOS'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'grupos:asignar_permisos');

-- Insertar permisos de gestión de permisos (si no existen)
INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'permisos:crear', 'Permite crear nuevos permisos', 'PERMISOS', 'CREATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'permisos:crear');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'permisos:editar', 'Permite editar permisos existentes', 'PERMISOS', 'UPDATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'permisos:editar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'permisos:eliminar', 'Permite eliminar permisos', 'PERMISOS', 'DELETE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'permisos:eliminar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'permisos:ver', 'Permite ver lista y detalles de permisos', 'PERMISOS', 'READ'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'permisos:ver');

-- Asegurar que existan los roles ADMIN, SUPERVISOR y OPERADOR
-- (Ya deberían existir en V2, pero los creamos si no existen)
INSERT INTO rol (nombre, descripcion, activo, fecha_creacion)
SELECT 'ADMIN', 'Administrador del sistema con acceso completo', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'ADMIN');

INSERT INTO rol (nombre, descripcion, activo, fecha_creacion)
SELECT 'SUPERVISOR', 'Supervisor que puede ver reportes y gestionar operaciones', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'SUPERVISOR');

INSERT INTO rol (nombre, descripcion, activo, fecha_creacion)
SELECT 'OPERADOR', 'Operador que puede realizar operaciones de negocio', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'OPERADOR');

-- Asignar TODOS los permisos de gestión al rol ADMIN
INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT r.id_rol, p.id_permiso, CURRENT_TIMESTAMP
FROM rol r
CROSS JOIN permiso p
WHERE r.nombre = 'ADMIN'
  AND p.nombre IN (
    'usuarios:crear', 'usuarios:editar', 'usuarios:eliminar', 'usuarios:ver', 'usuarios:asignar_roles',
    'roles:crear', 'roles:editar', 'roles:eliminar', 'roles:ver', 'roles:asignar_permisos',
    'grupos:crear', 'grupos:editar', 'grupos:eliminar', 'grupos:ver', 'grupos:asignar_usuarios', 'grupos:asignar_roles', 'grupos:asignar_permisos',
    'permisos:crear', 'permisos:editar', 'permisos:eliminar', 'permisos:ver'
  )
  AND NOT EXISTS (
    SELECT 1 FROM rol_permiso rp 
    WHERE rp.id_rol = r.id_rol AND rp.id_permiso = p.id_permiso
  );

-- Asignar permisos de solo lectura al rol SUPERVISOR
INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT r.id_rol, p.id_permiso, CURRENT_TIMESTAMP
FROM rol r
CROSS JOIN permiso p
WHERE r.nombre = 'SUPERVISOR'
  AND p.nombre IN (
    'usuarios:ver',
    'roles:ver',
    'grupos:ver',
    'permisos:ver'
  )
  AND NOT EXISTS (
    SELECT 1 FROM rol_permiso rp 
    WHERE rp.id_rol = r.id_rol AND rp.id_permiso = p.id_permiso
  );

-- OPERADOR no tiene permisos de gestión (solo operaciones de negocio)
-- Los permisos de negocio ya están definidos en V2 y se pueden asignar manualmente si es necesario

-- Asegurar que el usuario "backset" tenga rol ADMIN
-- (Ya debería estar en V32, pero lo aseguramos aquí también)
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
  AND NOT EXISTS (
    SELECT 1 
    FROM usuario_rol ur 
    WHERE ur.id_usuario = u.id_usuario 
      AND ur.id_rol = r.id_rol
  )
ON CONFLICT (id_usuario, id_rol) 
DO UPDATE SET 
    activo = TRUE,
    fecha_asignacion = CURRENT_TIMESTAMP;
