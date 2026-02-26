-- V20__create_envio_directo.sql

CREATE TABLE envio_directo (
    id_envio_directo BIGSERIAL PRIMARY KEY,
    id_despacho BIGINT NOT NULL UNIQUE,
    id_cliente_envio_directo BIGINT NOT NULL,
    CONSTRAINT fk_envio_directo_despacho FOREIGN KEY (id_despacho) 
        REFERENCES despacho(id_despacho) ON DELETE CASCADE,
    CONSTRAINT fk_envio_directo_cliente FOREIGN KEY (id_cliente_envio_directo) 
        REFERENCES cliente_envio_directo(id_cliente_envio_directo) ON DELETE RESTRICT
);
