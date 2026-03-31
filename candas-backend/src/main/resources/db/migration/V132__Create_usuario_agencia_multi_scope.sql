DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'usuario_agencia'
    ) THEN
        CREATE TABLE public.usuario_agencia (
            id_usuario BIGINT NOT NULL,
            id_agencia BIGINT NOT NULL,
            fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT pk_usuario_agencia PRIMARY KEY (id_usuario, id_agencia),
            CONSTRAINT fk_usuario_agencia_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE,
            CONSTRAINT fk_usuario_agencia_agencia FOREIGN KEY (id_agencia) REFERENCES public.agencia(id_agencia) ON DELETE CASCADE
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'idx_usuario_agencia_id_agencia'
    ) THEN
        CREATE INDEX idx_usuario_agencia_id_agencia
            ON public.usuario_agencia (id_agencia);
    END IF;

    -- Backfill compatibilidad desde usuario.id_agencia (modelo legado)
    INSERT INTO public.usuario_agencia (id_usuario, id_agencia, fecha_asignacion)
    SELECT u.id_usuario, u.id_agencia, CURRENT_TIMESTAMP
    FROM public.usuario u
    WHERE u.id_agencia IS NOT NULL
    ON CONFLICT (id_usuario, id_agencia) DO NOTHING;
END $$;
