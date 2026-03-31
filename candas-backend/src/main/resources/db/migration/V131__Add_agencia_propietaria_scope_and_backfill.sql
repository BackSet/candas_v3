DO $$
DECLARE
    v_agencia_propietaria_id BIGINT;
BEGIN
    -- 1) Despacho: columna + FK + índice
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'despacho'
          AND column_name = 'id_agencia_propietaria'
    ) THEN
        ALTER TABLE public.despacho
            ADD COLUMN id_agencia_propietaria BIGINT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'despacho'
          AND constraint_name = 'fk_despacho_agencia_propietaria'
    ) THEN
        ALTER TABLE public.despacho
            ADD CONSTRAINT fk_despacho_agencia_propietaria
            FOREIGN KEY (id_agencia_propietaria) REFERENCES public.agencia(id_agencia);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'idx_despacho_id_agencia_propietaria'
    ) THEN
        CREATE INDEX idx_despacho_id_agencia_propietaria
            ON public.despacho (id_agencia_propietaria);
    END IF;

    -- 2) Manifiesto consolidado: columna + FK + índice
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'manifiesto_consolidado'
          AND column_name = 'id_agencia_propietaria'
    ) THEN
        ALTER TABLE public.manifiesto_consolidado
            ADD COLUMN id_agencia_propietaria BIGINT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'manifiesto_consolidado'
          AND constraint_name = 'fk_manifiesto_agencia_propietaria'
    ) THEN
        ALTER TABLE public.manifiesto_consolidado
            ADD CONSTRAINT fk_manifiesto_agencia_propietaria
            FOREIGN KEY (id_agencia_propietaria) REFERENCES public.agencia(id_agencia);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'idx_manifiesto_id_agencia_propietaria'
    ) THEN
        CREATE INDEX idx_manifiesto_id_agencia_propietaria
            ON public.manifiesto_consolidado (id_agencia_propietaria);
    END IF;

    -- 3) Atención paquete: columna + FK + índice
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'atencion_paquete'
          AND column_name = 'id_agencia_propietaria'
    ) THEN
        ALTER TABLE public.atencion_paquete
            ADD COLUMN id_agencia_propietaria BIGINT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'atencion_paquete'
          AND constraint_name = 'fk_atencion_agencia_propietaria'
    ) THEN
        ALTER TABLE public.atencion_paquete
            ADD CONSTRAINT fk_atencion_agencia_propietaria
            FOREIGN KEY (id_agencia_propietaria) REFERENCES public.agencia(id_agencia);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'idx_atencion_id_agencia_propietaria'
    ) THEN
        CREATE INDEX idx_atencion_id_agencia_propietaria
            ON public.atencion_paquete (id_agencia_propietaria);
    END IF;

    -- 4) Resolver agencia objetivo para backfill histórico
    SELECT a.id_agencia
    INTO v_agencia_propietaria_id
    FROM public.agencia a
    WHERE UPPER(TRIM(a.nombre)) = 'MV SERVICES BODEGA QUITO SUR'
    LIMIT 1;

    IF v_agencia_propietaria_id IS NULL THEN
        RAISE EXCEPTION 'V131: No existe la agencia "MV SERVICES BODEGA QUITO SUR".';
    END IF;

    -- 5) Backfill histórico (sin tocar lote_recepcion)
    UPDATE public.despacho
    SET id_agencia_propietaria = v_agencia_propietaria_id
    WHERE id_agencia_propietaria IS NULL;

    UPDATE public.manifiesto_consolidado
    SET id_agencia_propietaria = v_agencia_propietaria_id
    WHERE id_agencia_propietaria IS NULL;

    UPDATE public.atencion_paquete
    SET id_agencia_propietaria = v_agencia_propietaria_id
    WHERE id_agencia_propietaria IS NULL;
END $$;
