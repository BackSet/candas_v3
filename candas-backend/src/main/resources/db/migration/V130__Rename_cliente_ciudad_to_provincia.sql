DO $$
BEGIN
    -- Caso 1: existe ciudad y no existe provincia -> rename directo
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'cliente'
          AND column_name = 'ciudad'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'cliente'
          AND column_name = 'provincia'
    ) THEN
        ALTER TABLE public.cliente RENAME COLUMN ciudad TO provincia;
    END IF;

    -- Caso 2: existen ambas columnas -> conservar datos y eliminar ciudad
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'cliente'
          AND column_name = 'ciudad'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'cliente'
          AND column_name = 'provincia'
    ) THEN
        EXECUTE 'UPDATE public.cliente SET provincia = COALESCE(provincia, ciudad) WHERE ciudad IS NOT NULL';
        ALTER TABLE public.cliente DROP COLUMN ciudad;
    END IF;
END $$;
