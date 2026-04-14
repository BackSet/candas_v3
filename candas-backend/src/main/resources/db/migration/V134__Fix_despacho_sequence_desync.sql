-- Corrige desincronización de la secuencia de despacho para evitar
-- errores de clave duplicada en id_despacho al insertar nuevos registros.
DO $$
DECLARE
    seq_name text;
    max_id bigint;
BEGIN
    seq_name := pg_get_serial_sequence('public.despacho', 'id_despacho');

    IF seq_name IS NULL THEN
        RAISE NOTICE 'V134: No se encontró secuencia para public.despacho.id_despacho.';
        RETURN;
    END IF;

    SELECT COALESCE(MAX(id_despacho), 0) INTO max_id FROM public.despacho;

    IF max_id = 0 THEN
        PERFORM setval(seq_name, 1, false);
        RAISE NOTICE 'V134: Secuencia % reiniciada en 1 (tabla vacía).', seq_name;
    ELSE
        PERFORM setval(seq_name, max_id, true);
        RAISE NOTICE 'V134: Secuencia % sincronizada al id máximo %.', seq_name, max_id;
    END IF;
END $$;
