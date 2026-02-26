-- Script para reparar el checksum de la migración V41
-- Ejecutar este script directamente en PostgreSQL antes de iniciar la aplicación
-- 
-- Este script elimina la entrada de flyway_schema_history para la versión 41
-- para que Flyway pueda ejecutarla nuevamente con el nuevo contenido

DELETE FROM flyway_schema_history WHERE version = '41';

-- Verificar que se eliminó
SELECT * FROM flyway_schema_history WHERE version = '41';

-- Si la consulta anterior no devuelve resultados, la entrada fue eliminada correctamente
-- Ahora puedes iniciar la aplicación y Flyway ejecutará V41 nuevamente
