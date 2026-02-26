-- Sesión de despacho masivo por usuario: payload JSON para vista "Ver despacho en curso"
CREATE TABLE despacho_masivo_sesion (
    id_usuario BIGINT NOT NULL PRIMARY KEY,
    payload TEXT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_despacho_masivo_sesion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

CREATE INDEX idx_despacho_masivo_sesion_updated_at ON despacho_masivo_sesion(updated_at);
