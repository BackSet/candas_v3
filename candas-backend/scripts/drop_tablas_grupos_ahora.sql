-- Ejecutar en la base candas_v3 (PostgreSQL) para eliminar las tablas de grupos.
-- CASCADE quita dependencias (FK) automáticamente.

DROP TABLE IF EXISTS grupo_personalizado_paquete CASCADE;
DROP TABLE IF EXISTS grupo_personalizado CASCADE;
DROP TABLE IF EXISTS usuario_grupo CASCADE;
DROP TABLE IF EXISTS rol_grupo CASCADE;
DROP TABLE IF EXISTS grupo_permiso CASCADE;
DROP TABLE IF EXISTS grupo CASCADE;
