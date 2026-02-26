-- Asignar rol ADMIN al usuario "backset"
-- Si el usuario no existe, este script no hará nada
-- Si ya tiene el rol asignado, se actualizará para asegurar que esté activo

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
