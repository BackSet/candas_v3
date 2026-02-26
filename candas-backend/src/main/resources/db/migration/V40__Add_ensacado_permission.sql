-- Migración V40: Permiso para operaciones de ensacado
-- Esta migración crea el permiso de ensacado y lo asigna a los roles apropiados

-- ============================================
-- PERMISO DE ENSACADO
-- ============================================
INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'ensacado:operar', 'Permite realizar operaciones de ensacado de paquetes', 'ENSACADO', 'OPERAR'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'ensacado:operar');

-- ============================================
-- ASIGNACIÓN DE PERMISOS A ROLES
-- ============================================

-- ADMINISTRADOR: Todos los permisos incluyendo ensacado
INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT r.id_rol, p.id_permiso, CURRENT_TIMESTAMP
FROM rol r
CROSS JOIN permiso p
WHERE r.nombre = 'ADMINISTRADOR'
  AND p.nombre = 'ensacado:operar'
  AND NOT EXISTS (
    SELECT 1 FROM rol_permiso rp 
    WHERE rp.id_rol = r.id_rol AND rp.id_permiso = p.id_permiso
  );

-- OPERADOR: Permiso de ensacado para operaciones diarias
INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT r.id_rol, p.id_permiso, CURRENT_TIMESTAMP
FROM rol r
CROSS JOIN permiso p
WHERE r.nombre = 'OPERADOR'
  AND p.nombre = 'ensacado:operar'
  AND NOT EXISTS (
    SELECT 1 FROM rol_permiso rp 
    WHERE rp.id_rol = r.id_rol AND rp.id_permiso = p.id_permiso
  );
