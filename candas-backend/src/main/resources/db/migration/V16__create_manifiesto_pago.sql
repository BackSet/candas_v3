CREATE TABLE manifiesto_pago (
    id_manifiesto_pago BIGSERIAL PRIMARY KEY,
    id_agencia BIGINT NOT NULL REFERENCES agencia(id_agencia),
    fecha_inicio DATE,
    fecha_fin DATE,
    mes INTEGER,
    anio INTEGER,
    fecha_generacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_generador VARCHAR(255) NOT NULL,
    total_despachos INTEGER DEFAULT 0,
    total_sacas INTEGER DEFAULT 0,
    total_paquetes INTEGER DEFAULT 0,
    peso_total DECIMAL(10, 2),
    CONSTRAINT chk_periodo CHECK (
        (fecha_inicio IS NOT NULL AND fecha_fin IS NOT NULL) OR
        (mes IS NOT NULL AND anio IS NOT NULL)
    )
);

CREATE INDEX idx_manifiesto_pago_agencia ON manifiesto_pago(id_agencia);
CREATE INDEX idx_manifiesto_pago_fecha_generacion ON manifiesto_pago(fecha_generacion DESC);
