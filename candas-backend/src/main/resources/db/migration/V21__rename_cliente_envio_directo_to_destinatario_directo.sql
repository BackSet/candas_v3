-- V21__rename_cliente_envio_directo_to_destinatario_directo.sql

-- Renombrar tabla
ALTER TABLE cliente_envio_directo RENAME TO destinatario_directo;

-- Renombrar columnas
ALTER TABLE destinatario_directo RENAME COLUMN id_cliente_envio_directo TO id_destinatario_directo;
ALTER TABLE destinatario_directo RENAME COLUMN nombre_cliente TO nombre_destinatario;
ALTER TABLE destinatario_directo RENAME COLUMN telefono_cliente TO telefono_destinatario;
ALTER TABLE destinatario_directo RENAME COLUMN direccion_cliente TO direccion_destinatario;
