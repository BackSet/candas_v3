-- Asignar permisos de "ver lista" al rol OPERARIO para que usuarios con ese rol
-- puedan acceder a listas de paquetes, despachos, etc. sin asignación manual previa.

INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT r.id_rol, p.id_permiso, CURRENT_TIMESTAMP
FROM rol r
CROSS JOIN permiso p
WHERE r.nombre = 'OPERARIO'
  AND p.nombre IN (
    'paquetes:ver',
    'clientes:ver',
    'agencias:ver',
    'puntos_origen:ver',
    'lotes_recepcion:ver',
    'sacas:ver',
    'despachos:ver',
    'atencion_paquetes:ver',
    'destinatarios_directos:ver',
    'distribuidores:ver',
    'manifiestos_consolidados:ver'
  )
  AND NOT EXISTS (
    SELECT 1 FROM rol_permiso rp
    WHERE rp.id_rol = r.id_rol AND rp.id_permiso = p.id_permiso
  );
