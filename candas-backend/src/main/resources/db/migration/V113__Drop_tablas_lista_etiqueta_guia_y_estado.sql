-- Eliminar tablas de la funcionalidad antigua de listas etiquetadas.
-- No se migran datos; el nuevo flujo usa solo la entidad paquete (ref, observaciones).

DROP TABLE IF EXISTS lista_etiqueta_guia;
DROP TABLE IF EXISTS lista_etiqueta_estado;
