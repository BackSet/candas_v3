-- Limpieza de roles y matriz final de permisos.
-- Objetivo: conservar roles activos ADMIN, OPERARIO, SUPERVISOR y AUDITOR.
-- Eliminar roles legados/no usados: OPERADOR y CLIENTE.

-- 1) Asegurar roles objetivo
INSERT INTO rol (nombre, descripcion, activo, fecha_creacion)
SELECT 'OPERARIO', 'Operario que puede realizar operaciones de negocio', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'OPERARIO');

INSERT INTO rol (nombre, descripcion, activo, fecha_creacion)
SELECT 'SUPERVISOR', 'Supervisor con capacidades de lectura y gestión de atención', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'SUPERVISOR');

INSERT INTO rol (nombre, descripcion, activo, fecha_creacion)
SELECT 'AUDITOR', 'Auditor con acceso de solo lectura', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'AUDITOR');

UPDATE rol
SET activo = TRUE
WHERE nombre IN ('ADMIN', 'OPERARIO', 'SUPERVISOR', 'AUDITOR');

-- 2) Migrar usuarios activos de CLIENTE/OPERADOR hacia OPERARIO (fallback seguro)
INSERT INTO usuario_rol (id_usuario, id_rol, fecha_asignacion, activo)
SELECT ur.id_usuario, rOperario.id_rol, CURRENT_TIMESTAMP, TRUE
FROM usuario_rol ur
JOIN rol rOrigen ON rOrigen.id_rol = ur.id_rol
JOIN rol rOperario ON rOperario.nombre = 'OPERARIO'
WHERE ur.activo = TRUE
  AND rOrigen.nombre IN ('CLIENTE', 'OPERADOR')
ON CONFLICT (id_usuario, id_rol)
DO UPDATE SET activo = TRUE, fecha_asignacion = CURRENT_TIMESTAMP;

-- 3) Limpiar permisos de roles no-admin para reconstruir matriz recomendada
DELETE FROM rol_permiso rp
USING rol r
WHERE rp.id_rol = r.id_rol
  AND r.nombre IN ('OPERARIO', 'SUPERVISOR', 'AUDITOR');

-- 4) ADMIN: todos los permisos
INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT r.id_rol, p.id_permiso, CURRENT_TIMESTAMP
FROM rol r
CROSS JOIN permiso p
WHERE r.nombre = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1
    FROM rol_permiso rp
    WHERE rp.id_rol = r.id_rol
      AND rp.id_permiso = p.id_permiso
  );

-- 5) OPERARIO: permisos operativos (todo excepto administración de usuarios/roles/permisos/grupos)
INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT r.id_rol, p.id_permiso, CURRENT_TIMESTAMP
FROM rol r
JOIN permiso p ON 1 = 1
WHERE r.nombre = 'OPERARIO'
  AND p.nombre LIKE '%:%'
  AND p.nombre NOT LIKE 'usuarios:%'
  AND p.nombre NOT LIKE 'roles:%'
  AND p.nombre NOT LIKE 'permisos:%'
  AND p.nombre NOT LIKE 'grupos:%'
  AND NOT EXISTS (
    SELECT 1
    FROM rol_permiso rp
    WHERE rp.id_rol = r.id_rol
      AND rp.id_permiso = p.id_permiso
  );

-- 6) SUPERVISOR: lectura + atención/supervisión operativa
INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT r.id_rol, p.id_permiso, CURRENT_TIMESTAMP
FROM rol r
JOIN permiso p ON 1 = 1
WHERE r.nombre = 'SUPERVISOR'
  AND (
    p.nombre LIKE '%:ver'
    OR p.nombre LIKE '%:listar'
    OR p.nombre IN (
      'atencion_paquetes:crear',
      'atencion_paquetes:editar',
      'manifiestos_consolidados:generar'
    )
  )
  AND NOT EXISTS (
    SELECT 1
    FROM rol_permiso rp
    WHERE rp.id_rol = r.id_rol
      AND rp.id_permiso = p.id_permiso
  );

-- 7) AUDITOR: solo lectura
INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT r.id_rol, p.id_permiso, CURRENT_TIMESTAMP
FROM rol r
JOIN permiso p ON 1 = 1
WHERE r.nombre = 'AUDITOR'
  AND (p.nombre LIKE '%:ver' OR p.nombre LIKE '%:listar')
  AND NOT EXISTS (
    SELECT 1
    FROM rol_permiso rp
    WHERE rp.id_rol = r.id_rol
      AND rp.id_permiso = p.id_permiso
  );

-- 8) Eliminar roles no usados (sus relaciones se limpian por FK ON DELETE CASCADE)
DELETE FROM rol
WHERE nombre IN ('CLIENTE', 'OPERADOR');
