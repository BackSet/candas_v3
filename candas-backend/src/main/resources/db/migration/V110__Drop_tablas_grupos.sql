-- V110: Eliminar tablas de grupos (sistema de usuarios por rol y permisos, ya no por grupos)

DROP TABLE IF EXISTS grupo_personalizado_paquete CASCADE;
DROP TABLE IF EXISTS grupo_personalizado CASCADE;
DROP TABLE IF EXISTS usuario_grupo CASCADE;
DROP TABLE IF EXISTS rol_grupo CASCADE;
DROP TABLE IF EXISTS grupo_permiso CASCADE;
DROP TABLE IF EXISTS grupo CASCADE;
