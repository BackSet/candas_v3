-- Agregar columna id_telefono_destinatario a la tabla paquete
ALTER TABLE paquete 
ADD COLUMN IF NOT EXISTS id_telefono_destinatario BIGINT;

-- Agregar foreign key constraint hacia telefono_cliente
ALTER TABLE paquete
ADD CONSTRAINT fk_paquete_telefono_destinatario 
FOREIGN KEY (id_telefono_destinatario) 
REFERENCES telefono_cliente(id_telefono) 
ON DELETE SET NULL;

-- Agregar índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_paquete_telefono_destinatario 
ON paquete(id_telefono_destinatario);
