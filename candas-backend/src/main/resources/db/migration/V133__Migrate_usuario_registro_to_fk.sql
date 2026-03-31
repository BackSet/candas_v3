-- Migracion idempotente de usuario_registro/usuario_generador (texto) a FK.
-- Soporta BDs donde parte de los cambios ya existan por intentos previos.

ALTER TABLE public.despacho
    ADD COLUMN IF NOT EXISTS id_usuario_registro BIGINT;

ALTER TABLE public.lote_recepcion
    ADD COLUMN IF NOT EXISTS id_usuario_registro BIGINT;

ALTER TABLE public.paquete_no_encontrado
    ADD COLUMN IF NOT EXISTS id_usuario_registro BIGINT;

ALTER TABLE public.manifiesto_consolidado
    ADD COLUMN IF NOT EXISTS id_usuario_generador BIGINT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'despacho' AND column_name = 'usuario_registro'
    ) THEN
        UPDATE public.despacho d
        SET id_usuario_registro = (
            SELECT u.id_usuario
            FROM public.usuario u
            WHERE NULLIF(BTRIM(d.usuario_registro), '') IS NOT NULL
              AND (
                  LOWER(BTRIM(u.username)) = LOWER(BTRIM(d.usuario_registro))
                  OR LOWER(BTRIM(COALESCE(u.nombre_completo, ''))) = LOWER(BTRIM(d.usuario_registro))
                  OR LOWER(BTRIM(COALESCE(u.email, ''))) = LOWER(BTRIM(d.usuario_registro))
                  OR LOWER(BTRIM(u.username)) LIKE LOWER(BTRIM(d.usuario_registro)) || '%'
                  OR LOWER(BTRIM(COALESCE(u.nombre_completo, ''))) LIKE '%' || LOWER(BTRIM(d.usuario_registro)) || '%'
              )
            ORDER BY
              CASE
                  WHEN LOWER(BTRIM(u.username)) = LOWER(BTRIM(d.usuario_registro)) THEN 0
                  WHEN LOWER(BTRIM(COALESCE(u.nombre_completo, ''))) = LOWER(BTRIM(d.usuario_registro)) THEN 1
                  WHEN LOWER(BTRIM(COALESCE(u.email, ''))) = LOWER(BTRIM(d.usuario_registro)) THEN 2
                  WHEN LOWER(BTRIM(u.username)) LIKE LOWER(BTRIM(d.usuario_registro)) || '%' THEN 3
                  WHEN LOWER(BTRIM(COALESCE(u.nombre_completo, ''))) LIKE '%' || LOWER(BTRIM(d.usuario_registro)) || '%' THEN 4
                  ELSE 100
              END,
              u.id_usuario
            LIMIT 1
        )
        WHERE d.id_usuario_registro IS NULL
          AND NULLIF(BTRIM(d.usuario_registro), '') IS NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lote_recepcion' AND column_name = 'usuario_registro'
    ) THEN
        UPDATE public.lote_recepcion lr
        SET id_usuario_registro = (
            SELECT u.id_usuario
            FROM public.usuario u
            WHERE NULLIF(BTRIM(lr.usuario_registro), '') IS NOT NULL
              AND (
                  LOWER(BTRIM(u.username)) = LOWER(BTRIM(lr.usuario_registro))
                  OR LOWER(BTRIM(COALESCE(u.nombre_completo, ''))) = LOWER(BTRIM(lr.usuario_registro))
                  OR LOWER(BTRIM(COALESCE(u.email, ''))) = LOWER(BTRIM(lr.usuario_registro))
                  OR LOWER(BTRIM(u.username)) LIKE LOWER(BTRIM(lr.usuario_registro)) || '%'
                  OR LOWER(BTRIM(COALESCE(u.nombre_completo, ''))) LIKE '%' || LOWER(BTRIM(lr.usuario_registro)) || '%'
              )
            ORDER BY
              CASE
                  WHEN LOWER(BTRIM(u.username)) = LOWER(BTRIM(lr.usuario_registro)) THEN 0
                  WHEN LOWER(BTRIM(COALESCE(u.nombre_completo, ''))) = LOWER(BTRIM(lr.usuario_registro)) THEN 1
                  WHEN LOWER(BTRIM(COALESCE(u.email, ''))) = LOWER(BTRIM(lr.usuario_registro)) THEN 2
                  WHEN LOWER(BTRIM(u.username)) LIKE LOWER(BTRIM(lr.usuario_registro)) || '%' THEN 3
                  WHEN LOWER(BTRIM(COALESCE(u.nombre_completo, ''))) LIKE '%' || LOWER(BTRIM(lr.usuario_registro)) || '%' THEN 4
                  ELSE 100
              END,
              u.id_usuario
            LIMIT 1
        )
        WHERE lr.id_usuario_registro IS NULL
          AND NULLIF(BTRIM(lr.usuario_registro), '') IS NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'paquete_no_encontrado' AND column_name = 'usuario_registro'
    ) THEN
        UPDATE public.paquete_no_encontrado pne
        SET id_usuario_registro = (
            SELECT u.id_usuario
            FROM public.usuario u
            WHERE NULLIF(BTRIM(pne.usuario_registro), '') IS NOT NULL
              AND (
                  LOWER(BTRIM(u.username)) = LOWER(BTRIM(pne.usuario_registro))
                  OR LOWER(BTRIM(COALESCE(u.nombre_completo, ''))) = LOWER(BTRIM(pne.usuario_registro))
                  OR LOWER(BTRIM(COALESCE(u.email, ''))) = LOWER(BTRIM(pne.usuario_registro))
                  OR LOWER(BTRIM(u.username)) LIKE LOWER(BTRIM(pne.usuario_registro)) || '%'
                  OR LOWER(BTRIM(COALESCE(u.nombre_completo, ''))) LIKE '%' || LOWER(BTRIM(pne.usuario_registro)) || '%'
              )
            ORDER BY
              CASE
                  WHEN LOWER(BTRIM(u.username)) = LOWER(BTRIM(pne.usuario_registro)) THEN 0
                  WHEN LOWER(BTRIM(COALESCE(u.nombre_completo, ''))) = LOWER(BTRIM(pne.usuario_registro)) THEN 1
                  WHEN LOWER(BTRIM(COALESCE(u.email, ''))) = LOWER(BTRIM(pne.usuario_registro)) THEN 2
                  WHEN LOWER(BTRIM(u.username)) LIKE LOWER(BTRIM(pne.usuario_registro)) || '%' THEN 3
                  WHEN LOWER(BTRIM(COALESCE(u.nombre_completo, ''))) LIKE '%' || LOWER(BTRIM(pne.usuario_registro)) || '%' THEN 4
                  ELSE 100
              END,
              u.id_usuario
            LIMIT 1
        )
        WHERE pne.id_usuario_registro IS NULL
          AND NULLIF(BTRIM(pne.usuario_registro), '') IS NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'manifiesto_consolidado' AND column_name = 'usuario_generador'
    ) THEN
        UPDATE public.manifiesto_consolidado mc
        SET id_usuario_generador = (
            SELECT u.id_usuario
            FROM public.usuario u
            WHERE NULLIF(BTRIM(mc.usuario_generador), '') IS NOT NULL
              AND (
                  LOWER(BTRIM(u.username)) = LOWER(BTRIM(mc.usuario_generador))
                  OR LOWER(BTRIM(COALESCE(u.nombre_completo, ''))) = LOWER(BTRIM(mc.usuario_generador))
                  OR LOWER(BTRIM(COALESCE(u.email, ''))) = LOWER(BTRIM(mc.usuario_generador))
                  OR LOWER(BTRIM(u.username)) LIKE LOWER(BTRIM(mc.usuario_generador)) || '%'
                  OR LOWER(BTRIM(COALESCE(u.nombre_completo, ''))) LIKE '%' || LOWER(BTRIM(mc.usuario_generador)) || '%'
              )
            ORDER BY
              CASE
                  WHEN LOWER(BTRIM(u.username)) = LOWER(BTRIM(mc.usuario_generador)) THEN 0
                  WHEN LOWER(BTRIM(COALESCE(u.nombre_completo, ''))) = LOWER(BTRIM(mc.usuario_generador)) THEN 1
                  WHEN LOWER(BTRIM(COALESCE(u.email, ''))) = LOWER(BTRIM(mc.usuario_generador)) THEN 2
                  WHEN LOWER(BTRIM(u.username)) LIKE LOWER(BTRIM(mc.usuario_generador)) || '%' THEN 3
                  WHEN LOWER(BTRIM(COALESCE(u.nombre_completo, ''))) LIKE '%' || LOWER(BTRIM(mc.usuario_generador)) || '%' THEN 4
                  ELSE 100
              END,
              u.id_usuario
            LIMIT 1
        )
        WHERE mc.id_usuario_generador IS NULL
          AND NULLIF(BTRIM(mc.usuario_generador), '') IS NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_despacho_usuario_registro'
    ) THEN
        ALTER TABLE public.despacho
            ADD CONSTRAINT fk_despacho_usuario_registro
            FOREIGN KEY (id_usuario_registro) REFERENCES public.usuario(id_usuario);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_lote_recepcion_usuario_registro'
    ) THEN
        ALTER TABLE public.lote_recepcion
            ADD CONSTRAINT fk_lote_recepcion_usuario_registro
            FOREIGN KEY (id_usuario_registro) REFERENCES public.usuario(id_usuario);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_paq_no_encontrado_usuario_registro'
    ) THEN
        ALTER TABLE public.paquete_no_encontrado
            ADD CONSTRAINT fk_paq_no_encontrado_usuario_registro
            FOREIGN KEY (id_usuario_registro) REFERENCES public.usuario(id_usuario);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_manif_consolidado_usuario_generador'
    ) THEN
        ALTER TABLE public.manifiesto_consolidado
            ADD CONSTRAINT fk_manif_consolidado_usuario_generador
            FOREIGN KEY (id_usuario_generador) REFERENCES public.usuario(id_usuario);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_despacho_id_usuario_registro ON public.despacho(id_usuario_registro);
CREATE INDEX IF NOT EXISTS idx_lote_recepcion_id_usuario_registro ON public.lote_recepcion(id_usuario_registro);
CREATE INDEX IF NOT EXISTS idx_paquete_no_encontrado_id_usuario_registro ON public.paquete_no_encontrado(id_usuario_registro);
CREATE INDEX IF NOT EXISTS idx_manif_consolidado_id_usuario_generador ON public.manifiesto_consolidado(id_usuario_generador);

ALTER TABLE public.despacho
    DROP COLUMN IF EXISTS usuario_registro;

ALTER TABLE public.lote_recepcion
    DROP COLUMN IF EXISTS usuario_registro;

ALTER TABLE public.paquete_no_encontrado
    DROP COLUMN IF EXISTS usuario_registro;

ALTER TABLE public.manifiesto_consolidado
    DROP COLUMN IF EXISTS usuario_generador;
