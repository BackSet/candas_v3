-- Eliminar tablas relacionadas con grupos y permisos directos
-- Implementación de RBAC puro: Usuario -> Roles -> Permisos

-- Eliminar tablas de grupos (en orden inverso de dependencias)
DROP TABLE IF EXISTS grupo_permiso CASCADE;
DROP TABLE IF EXISTS rol_grupo CASCADE;
DROP TABLE IF EXISTS usuario_grupo CASCADE;
DROP TABLE IF EXISTS grupo CASCADE;

-- Eliminar tabla de permisos directos a usuarios
DROP TABLE IF EXISTS usuario_permiso CASCADE;

-- Eliminar índices relacionados (si existen)
DROP INDEX IF EXISTS idx_grupo_nombre;
DROP INDEX IF EXISTS idx_grupo_activo;
DROP INDEX IF EXISTS idx_usuario_grupo_id_usuario;
DROP INDEX IF EXISTS idx_usuario_grupo_id_grupo;
DROP INDEX IF EXISTS idx_rol_grupo_id_rol;
DROP INDEX IF EXISTS idx_rol_grupo_id_grupo;
DROP INDEX IF EXISTS idx_grupo_permiso_id_grupo;
DROP INDEX IF EXISTS idx_grupo_permiso_id_permiso;
DROP INDEX IF EXISTS idx_usuario_permiso_id_usuario;
DROP INDEX IF EXISTS idx_usuario_permiso_id_permiso;
