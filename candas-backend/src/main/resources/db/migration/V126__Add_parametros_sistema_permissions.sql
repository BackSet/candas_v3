-- Migración V126: Permisos para parámetros del sistema (plantilla WhatsApp despachos, etc.)
INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'parametros_sistema:ver', 'Permite ver y consultar parámetros del sistema', 'PARAMETROS_SISTEMA', 'READ'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'parametros_sistema:ver');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'parametros_sistema:editar', 'Permite editar parámetros del sistema (ej. plantilla WhatsApp despachos)', 'PARAMETROS_SISTEMA', 'UPDATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'parametros_sistema:editar');

-- ADMIN: ver y editar
INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT r.id_rol, p.id_permiso, CURRENT_TIMESTAMP
FROM rol r
CROSS JOIN permiso p
WHERE r.nombre = 'ADMIN'
  AND p.nombre IN ('parametros_sistema:ver', 'parametros_sistema:editar')
  AND NOT EXISTS (
    SELECT 1 FROM rol_permiso rp
    WHERE rp.id_rol = r.id_rol AND rp.id_permiso = p.id_permiso
  );

-- OPERADOR: ver y editar (el operario configura la plantilla de mensajes de despacho)
INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT r.id_rol, p.id_permiso, CURRENT_TIMESTAMP
FROM rol r
CROSS JOIN permiso p
WHERE r.nombre = 'OPERARIO'
  AND p.nombre IN ('parametros_sistema:ver', 'parametros_sistema:editar')
  AND NOT EXISTS (
    SELECT 1 FROM rol_permiso rp
    WHERE rp.id_rol = r.id_rol AND rp.id_permiso = p.id_permiso
  );
