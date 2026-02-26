-- Permisos "listar" para vistas con listas. Quien tenga listar o ver puede acceder a la lista.

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'paquetes:listar', 'Permite ver la lista de paquetes', 'PAQUETES', 'LIST'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'paquetes:listar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'clientes:listar', 'Permite ver la lista de clientes', 'CLIENTES', 'LIST'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'clientes:listar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'agencias:listar', 'Permite ver la lista de agencias', 'AGENCIAS', 'LIST'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'agencias:listar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'puntos_origen:listar', 'Permite ver la lista de puntos de origen', 'PUNTOS_ORIGEN', 'LIST'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'puntos_origen:listar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'lotes_recepcion:listar', 'Permite ver la lista de lotes de recepción', 'LOTES_RECEPCION', 'LIST'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'lotes_recepcion:listar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'sacas:listar', 'Permite ver la lista de sacas', 'SACAS', 'LIST'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'sacas:listar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'despachos:listar', 'Permite ver la lista de despachos', 'DESPACHOS', 'LIST'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'despachos:listar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'atencion_paquetes:listar', 'Permite ver la lista de atención de paquetes', 'ATENCION_PAQUETES', 'LIST'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'atencion_paquetes:listar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'usuarios:listar', 'Permite ver la lista de usuarios', 'USUARIOS', 'LIST'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'usuarios:listar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'roles:listar', 'Permite ver la lista de roles', 'ROLES', 'LIST'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'roles:listar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'permisos:listar', 'Permite ver la lista de permisos', 'PERMISOS', 'LIST'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'permisos:listar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'grupos:listar', 'Permite ver la lista de grupos', 'GRUPOS', 'LIST'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'grupos:listar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'distribuidores:listar', 'Permite ver la lista de distribuidores', 'DISTRIBUIDORES', 'LIST'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'distribuidores:listar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'manifiestos_consolidados:listar', 'Permite ver la lista de manifiestos consolidados', 'MANIFIESTOS_CONSOLIDADOS', 'LIST'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'manifiestos_consolidados:listar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'destinatarios_directos:listar', 'Permite ver la lista de destinatarios directos', 'DESTINATARIOS_DIRECTOS', 'LIST'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'destinatarios_directos:listar');

-- Asignar todos los permisos listar al rol ADMIN
INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT r.id_rol, p.id_permiso, CURRENT_TIMESTAMP
FROM rol r
CROSS JOIN permiso p
WHERE r.nombre = 'ADMIN'
  AND p.nombre IN (
    'paquetes:listar', 'clientes:listar', 'agencias:listar', 'puntos_origen:listar',
    'lotes_recepcion:listar', 'sacas:listar', 'despachos:listar', 'atencion_paquetes:listar',
    'usuarios:listar', 'roles:listar', 'permisos:listar', 'grupos:listar',
    'distribuidores:listar', 'manifiestos_consolidados:listar', 'destinatarios_directos:listar'
  )
  AND NOT EXISTS (
    SELECT 1 FROM rol_permiso rp
    WHERE rp.id_rol = r.id_rol AND rp.id_permiso = p.id_permiso
  );

-- Asignar los mismos permisos listar al rol OPERARIO
INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT r.id_rol, p.id_permiso, CURRENT_TIMESTAMP
FROM rol r
CROSS JOIN permiso p
WHERE r.nombre = 'OPERARIO'
  AND p.nombre IN (
    'paquetes:listar', 'clientes:listar', 'agencias:listar', 'puntos_origen:listar',
    'lotes_recepcion:listar', 'sacas:listar', 'despachos:listar', 'atencion_paquetes:listar',
    'usuarios:listar', 'roles:listar', 'permisos:listar', 'grupos:listar',
    'distribuidores:listar', 'manifiestos_consolidados:listar', 'destinatarios_directos:listar'
  )
  AND NOT EXISTS (
    SELECT 1 FROM rol_permiso rp
    WHERE rp.id_rol = r.id_rol AND rp.id_permiso = p.id_permiso
  );
