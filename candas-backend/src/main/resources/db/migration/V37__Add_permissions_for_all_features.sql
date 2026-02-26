-- Migración V37: Permisos para todas las funcionalidades del sistema
-- Esta migración crea permisos para todas las entidades del sistema y los asigna a los roles

-- ============================================
-- PERMISOS DE PAQUETES
-- ============================================
INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'paquetes:crear', 'Permite crear nuevos paquetes', 'PAQUETES', 'CREATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'paquetes:crear');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'paquetes:editar', 'Permite editar paquetes existentes', 'PAQUETES', 'UPDATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'paquetes:editar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'paquetes:eliminar', 'Permite eliminar paquetes', 'PAQUETES', 'DELETE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'paquetes:eliminar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'paquetes:ver', 'Permite ver lista y detalles de paquetes', 'PAQUETES', 'READ'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'paquetes:ver');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'paquetes:imprimir', 'Permite imprimir etiquetas de paquetes', 'PAQUETES', 'IMPRIMIR'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'paquetes:imprimir');

-- ============================================
-- PERMISOS DE CLIENTES
-- ============================================
INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'clientes:crear', 'Permite crear nuevos clientes', 'CLIENTES', 'CREATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'clientes:crear');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'clientes:editar', 'Permite editar clientes existentes', 'CLIENTES', 'UPDATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'clientes:editar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'clientes:eliminar', 'Permite eliminar clientes', 'CLIENTES', 'DELETE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'clientes:eliminar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'clientes:ver', 'Permite ver lista y detalles de clientes', 'CLIENTES', 'READ'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'clientes:ver');

-- ============================================
-- PERMISOS DE DESTINATARIOS DIRECTOS
-- ============================================
INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'destinatarios_directos:crear', 'Permite crear nuevos destinatarios directos', 'DESTINATARIOS_DIRECTOS', 'CREATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'destinatarios_directos:crear');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'destinatarios_directos:editar', 'Permite editar destinatarios directos existentes', 'DESTINATARIOS_DIRECTOS', 'UPDATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'destinatarios_directos:editar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'destinatarios_directos:eliminar', 'Permite eliminar destinatarios directos', 'DESTINATARIOS_DIRECTOS', 'DELETE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'destinatarios_directos:eliminar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'destinatarios_directos:ver', 'Permite ver lista y detalles de destinatarios directos', 'DESTINATARIOS_DIRECTOS', 'READ'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'destinatarios_directos:ver');

-- ============================================
-- PERMISOS DE AGENCIAS
-- ============================================
INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'agencias:crear', 'Permite crear nuevas agencias', 'AGENCIAS', 'CREATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'agencias:crear');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'agencias:editar', 'Permite editar agencias existentes', 'AGENCIAS', 'UPDATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'agencias:editar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'agencias:eliminar', 'Permite eliminar agencias', 'AGENCIAS', 'DELETE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'agencias:eliminar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'agencias:ver', 'Permite ver lista y detalles de agencias', 'AGENCIAS', 'READ'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'agencias:ver');

-- ============================================
-- PERMISOS DE DISTRIBUIDORES
-- ============================================
INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'distribuidores:crear', 'Permite crear nuevos distribuidores', 'DISTRIBUIDORES', 'CREATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'distribuidores:crear');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'distribuidores:editar', 'Permite editar distribuidores existentes', 'DISTRIBUIDORES', 'UPDATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'distribuidores:editar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'distribuidores:eliminar', 'Permite eliminar distribuidores', 'DISTRIBUIDORES', 'DELETE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'distribuidores:eliminar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'distribuidores:ver', 'Permite ver lista y detalles de distribuidores', 'DISTRIBUIDORES', 'READ'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'distribuidores:ver');

-- ============================================
-- PERMISOS DE PUNTOS DE ORIGEN
-- ============================================
INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'puntos_origen:crear', 'Permite crear nuevos puntos de origen', 'PUNTOS_ORIGEN', 'CREATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'puntos_origen:crear');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'puntos_origen:editar', 'Permite editar puntos de origen existentes', 'PUNTOS_ORIGEN', 'UPDATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'puntos_origen:editar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'puntos_origen:eliminar', 'Permite eliminar puntos de origen', 'PUNTOS_ORIGEN', 'DELETE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'puntos_origen:eliminar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'puntos_origen:ver', 'Permite ver lista y detalles de puntos de origen', 'PUNTOS_ORIGEN', 'READ'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'puntos_origen:ver');

-- ============================================
-- PERMISOS DE LOTES DE RECEPCIÓN
-- ============================================
INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'lotes_recepcion:crear', 'Permite crear nuevos lotes de recepción', 'LOTES_RECEPCION', 'CREATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'lotes_recepcion:crear');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'lotes_recepcion:editar', 'Permite editar lotes de recepción existentes', 'LOTES_RECEPCION', 'UPDATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'lotes_recepcion:editar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'lotes_recepcion:eliminar', 'Permite eliminar lotes de recepción', 'LOTES_RECEPCION', 'DELETE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'lotes_recepcion:eliminar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'lotes_recepcion:ver', 'Permite ver lista y detalles de lotes de recepción', 'LOTES_RECEPCION', 'READ'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'lotes_recepcion:ver');

-- ============================================
-- PERMISOS DE SACAS
-- ============================================
INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'sacas:crear', 'Permite crear nuevas sacas', 'SACAS', 'CREATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'sacas:crear');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'sacas:editar', 'Permite editar sacas existentes', 'SACAS', 'UPDATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'sacas:editar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'sacas:eliminar', 'Permite eliminar sacas', 'SACAS', 'DELETE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'sacas:eliminar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'sacas:ver', 'Permite ver lista y detalles de sacas', 'SACAS', 'READ'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'sacas:ver');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'sacas:imprimir', 'Permite imprimir etiquetas de sacas', 'SACAS', 'IMPRIMIR'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'sacas:imprimir');

-- ============================================
-- PERMISOS DE DESPACHOS
-- ============================================
INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'despachos:crear', 'Permite crear nuevos despachos', 'DESPACHOS', 'CREATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'despachos:crear');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'despachos:editar', 'Permite editar despachos existentes', 'DESPACHOS', 'UPDATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'despachos:editar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'despachos:eliminar', 'Permite eliminar despachos', 'DESPACHOS', 'DELETE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'despachos:eliminar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'despachos:ver', 'Permite ver lista y detalles de despachos', 'DESPACHOS', 'READ'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'despachos:ver');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'despachos:imprimir', 'Permite imprimir documentos de despachos', 'DESPACHOS', 'IMPRIMIR'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'despachos:imprimir');

-- ============================================
-- PERMISOS DE ATENCIÓN PAQUETES
-- ============================================
INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'atencion_paquetes:crear', 'Permite crear nuevas atenciones de paquetes', 'ATENCION_PAQUETES', 'CREATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'atencion_paquetes:crear');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'atencion_paquetes:editar', 'Permite editar atenciones de paquetes existentes', 'ATENCION_PAQUETES', 'UPDATE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'atencion_paquetes:editar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'atencion_paquetes:eliminar', 'Permite eliminar atenciones de paquetes', 'ATENCION_PAQUETES', 'DELETE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'atencion_paquetes:eliminar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'atencion_paquetes:ver', 'Permite ver lista y detalles de atenciones de paquetes', 'ATENCION_PAQUETES', 'READ'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'atencion_paquetes:ver');

-- ============================================
-- PERMISOS DE MANIFIESTOS CONSOLIDADOS
-- ============================================
INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'manifiestos_consolidados:generar', 'Permite generar manifiestos consolidados', 'MANIFIESTOS_CONSOLIDADOS', 'GENERAR'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'manifiestos_consolidados:generar');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'manifiestos_consolidados:ver', 'Permite ver lista y detalles de manifiestos consolidados', 'MANIFIESTOS_CONSOLIDADOS', 'READ'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'manifiestos_consolidados:ver');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'manifiestos_consolidados:imprimir', 'Permite imprimir manifiestos consolidados', 'MANIFIESTOS_CONSOLIDADOS', 'IMPRIMIR'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'manifiestos_consolidados:imprimir');

INSERT INTO permiso (nombre, descripcion, recurso, accion)
SELECT 'manifiestos_consolidados:eliminar', 'Permite eliminar manifiestos consolidados', 'MANIFIESTOS_CONSOLIDADOS', 'DELETE'
WHERE NOT EXISTS (SELECT 1 FROM permiso WHERE nombre = 'manifiestos_consolidados:eliminar');

-- ============================================
-- ASIGNAR PERMISOS A ROLES
-- ============================================

-- ADMIN: Todos los permisos (gestión + negocio)
INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT r.id_rol, p.id_permiso, CURRENT_TIMESTAMP
FROM rol r
CROSS JOIN permiso p
WHERE r.nombre = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM rol_permiso rp 
    WHERE rp.id_rol = r.id_rol AND rp.id_permiso = p.id_permiso
  );

-- SUPERVISOR: Solo permisos de lectura/visualización para todas las funcionalidades
INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT r.id_rol, p.id_permiso, CURRENT_TIMESTAMP
FROM rol r
CROSS JOIN permiso p
WHERE r.nombre = 'SUPERVISOR'
  AND p.nombre IN (
    -- Permisos de gestión (ya asignados en V33)
    'usuarios:ver',
    'roles:ver',
    'grupos:ver',
    'permisos:ver',
    -- Permisos de negocio (solo lectura)
    'paquetes:ver',
    'paquetes:imprimir',
    'clientes:ver',
    'destinatarios_directos:ver',
    'agencias:ver',
    'distribuidores:ver',
    'puntos_origen:ver',
    'lotes_recepcion:ver',
    'sacas:ver',
    'sacas:imprimir',
    'despachos:ver',
    'despachos:imprimir',
    'atencion_paquetes:ver',
    'manifiestos_consolidados:ver',
    'manifiestos_consolidados:imprimir'
  )
  AND NOT EXISTS (
    SELECT 1 FROM rol_permiso rp 
    WHERE rp.id_rol = r.id_rol AND rp.id_permiso = p.id_permiso
  );

-- OPERADOR: Permisos de operación para funcionalidades principales
INSERT INTO rol_permiso (id_rol, id_permiso, fecha_asignacion)
SELECT r.id_rol, p.id_permiso, CURRENT_TIMESTAMP
FROM rol r
CROSS JOIN permiso p
WHERE r.nombre = 'OPERADOR'
  AND p.nombre IN (
    'paquetes:crear',
    'paquetes:editar',
    'paquetes:ver',
    'paquetes:imprimir',
    'clientes:crear',
    'clientes:editar',
    'clientes:ver',
    'sacas:crear',
    'sacas:editar',
    'sacas:ver',
    'sacas:imprimir',
    'despachos:crear',
    'despachos:editar',
    'despachos:ver',
    'despachos:imprimir',
    'atencion_paquetes:crear',
    'atencion_paquetes:editar',
    'atencion_paquetes:ver'
  )
  AND NOT EXISTS (
    SELECT 1 FROM rol_permiso rp 
    WHERE rp.id_rol = r.id_rol AND rp.id_permiso = p.id_permiso
  );
