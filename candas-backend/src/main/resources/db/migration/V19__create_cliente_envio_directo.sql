-- V19__create_cliente_envio_directo.sql

CREATE TABLE cliente_envio_directo (
    id_cliente_envio_directo BIGSERIAL PRIMARY KEY,
    nombre_cliente VARCHAR(255) NOT NULL,
    telefono_cliente VARCHAR(255) NOT NULL,
    direccion_cliente TEXT,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);
