-- Normalizar rol de operación: OPERARIO (estándar)
-- Hay mezclas históricas entre OPERARIO (V2) y OPERADOR (V33/V37). Esta migración:
-- - Asegura OPERARIO activo
-- - Copia permisos de OPERADOR -> OPERARIO
-- - Migra usuarios con OPERADOR -> OPERARIO (y desactiva OPERADOR)
-- - Opcional: desactiva el rol OPERADOR

-- Asegurar rol OPERARIO existe y está activo
INSERT INTO rol (nombre, descripcion, activo, fecha_creacion)
SELECT 'OPERARIO', 'Operario que puede realizar operaciones de negocio', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'OPERARIO');

UPDATE rol SET activo = TRUE WHERE nombre = 'OPERARIO';

-- Copiar permisos OPERADOR -> OPERARIO (si existe OPERADOR)
INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT rOperario.id_rol, rp.id_permiso, CURRENT_TIMESTAMP
FROM rol rOperario
JOIN rol rOperador ON rOperador.nombre = 'OPERADOR'
JOIN rol_permiso rp ON rp.id_rol = rOperador.id_rol
WHERE rOperario.nombre = 'OPERARIO'
  AND NOT EXISTS (
    SELECT 1 FROM rol_permiso x
    WHERE x.id_rol = rOperario.id_rol AND x.id_permiso = rp.id_permiso
  );

-- Migrar usuarios con OPERADOR -> OPERARIO (manteniendo otras asignaciones)
INSERT INTO usuario_rol (id_usuario, id_rol, fecha_asignacion, activo)
SELECT ur.id_usuario, rOperario.id_rol, CURRENT_TIMESTAMP, TRUE
FROM usuario_rol ur
JOIN rol rOperador ON rOperador.id_rol = ur.id_rol AND rOperador.nombre = 'OPERADOR'
JOIN rol rOperario ON rOperario.nombre = 'OPERARIO'
WHERE ur.activo = TRUE
ON CONFLICT (id_usuario, id_rol)
DO UPDATE SET activo = TRUE, fecha_asignacion = CURRENT_TIMESTAMP;

-- Desactivar asignaciones OPERADOR
UPDATE usuario_rol
SET activo = FALSE
WHERE id_rol = (SELECT id_rol FROM rol WHERE nombre = 'OPERADOR')
  AND activo = TRUE;

-- Desactivar rol OPERADOR (opcional, para evitar uso futuro)
UPDATE rol
SET activo = FALSE
WHERE nombre = 'OPERADOR';

