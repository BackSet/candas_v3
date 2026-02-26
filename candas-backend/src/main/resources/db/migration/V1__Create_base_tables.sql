-- Creación de tipos ENUM
CREATE TYPE tipo_cliente_enum AS ENUM ('REMITENTE', 'DESTINATARIO', 'AMBOS');
CREATE TYPE estado_paquete_enum AS ENUM ('REGISTRADO', 'RECIBIDO', 'ENSACADO', 'DESPACHADO');
CREATE TYPE tipo_paquete_enum AS ENUM ('CLEMENTINA', 'SEPARAR', 'AGENCIA', 'DOMICILIO');
CREATE TYPE tamano_saca_enum AS ENUM ('INDIVIDUAL', 'PEQUENO', 'MEDIANO', 'GRANDE');
CREATE TYPE tipo_problema_atencion_enum AS ENUM ('FALTA_INFORMACION', 'DATOS_INCOMPLETOS', 'ERROR_ENVIO', 'OTRO');
CREATE TYPE estado_atencion_enum AS ENUM ('PENDIENTE', 'EN_REVISION', 'RESUELTO', 'CANCELADO');

-- Tabla CLIENTE
CREATE TABLE cliente (
    id_cliente BIGSERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    documento_identidad VARCHAR(100),
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion TEXT,
    tipo tipo_cliente_enum NOT NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabla AGENCIA
CREATE TABLE agencia (
    id_agencia BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(100) UNIQUE,
    direccion TEXT,
    telefono VARCHAR(50),
    email VARCHAR(255),
    activa BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabla ORIGEN_USA
CREATE TABLE origen_usa (
    id_origen BIGSERIAL PRIMARY KEY,
    nombre_agencia_usa VARCHAR(255) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabla RECEPCION
CREATE TABLE recepcion (
    id_recepcion BIGSERIAL PRIMARY KEY,
    numero_recepcion VARCHAR(100) UNIQUE NOT NULL,
    id_agencia BIGINT NOT NULL,
    fecha_recepcion TIMESTAMP NOT NULL,
    usuario_registro VARCHAR(100) NOT NULL,
    observaciones TEXT,
    CONSTRAINT fk_recepcion_agencia FOREIGN KEY (id_agencia) 
        REFERENCES agencia(id_agencia) ON DELETE RESTRICT
);

-- Tabla DESPACHO
CREATE TABLE despacho (
    id_despacho BIGSERIAL PRIMARY KEY,
    numero_manifiesto VARCHAR(100) UNIQUE NOT NULL,
    fecha_despacho TIMESTAMP NOT NULL,
    usuario_registro VARCHAR(100) NOT NULL,
    observaciones TEXT
);

-- Tabla SACA
CREATE TABLE saca (
    id_saca BIGSERIAL PRIMARY KEY,
    codigo_barras VARCHAR(100) UNIQUE NOT NULL,
    numero_orden INTEGER NOT NULL,
    tamano tamano_saca_enum NOT NULL,
    peso_total DECIMAL(10, 2),
    id_despacho BIGINT,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_ensacado TIMESTAMP,
    CONSTRAINT fk_saca_despacho FOREIGN KEY (id_despacho) 
        REFERENCES despacho(id_despacho) ON DELETE RESTRICT
);

-- Tabla PAQUETE
CREATE TABLE paquete (
    id_paquete BIGSERIAL PRIMARY KEY,
    numero_guia VARCHAR(100) UNIQUE,
    numero_master VARCHAR(100),
    peso_kilos DECIMAL(10, 2),
    estado estado_paquete_enum NOT NULL,
    tipo_paquete tipo_paquete_enum NOT NULL,
    id_origen_usa BIGINT,
    id_cliente_remitente BIGINT NOT NULL,
    id_cliente_destinatario BIGINT,
    id_agencia_destino BIGINT,
    id_recepcion BIGINT,
    id_saca BIGINT,
    id_paquete_padre BIGINT,
    etiqueta_destinatario TEXT,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_recepcion TIMESTAMP,
    fecha_ensacado TIMESTAMP,
    observaciones TEXT,
    CONSTRAINT fk_paquete_origen_usa FOREIGN KEY (id_origen_usa) 
        REFERENCES origen_usa(id_origen) ON DELETE RESTRICT,
    CONSTRAINT fk_paquete_cliente_remitente FOREIGN KEY (id_cliente_remitente) 
        REFERENCES cliente(id_cliente) ON DELETE RESTRICT,
    CONSTRAINT fk_paquete_cliente_destinatario FOREIGN KEY (id_cliente_destinatario) 
        REFERENCES cliente(id_cliente) ON DELETE RESTRICT,
    CONSTRAINT fk_paquete_agencia_destino FOREIGN KEY (id_agencia_destino) 
        REFERENCES agencia(id_agencia) ON DELETE RESTRICT,
    CONSTRAINT fk_paquete_recepcion FOREIGN KEY (id_recepcion) 
        REFERENCES recepcion(id_recepcion) ON DELETE RESTRICT,
    CONSTRAINT fk_paquete_saca FOREIGN KEY (id_saca) 
        REFERENCES saca(id_saca) ON DELETE RESTRICT,
    CONSTRAINT fk_paquete_padre FOREIGN KEY (id_paquete_padre) 
        REFERENCES paquete(id_paquete) ON DELETE RESTRICT,
    -- Check constraint: id_paquete_padre solo puede tener valor si tipo_paquete = SEPARAR
    CONSTRAINT chk_paquete_padre_separar CHECK (
        (tipo_paquete = 'SEPARAR' AND id_paquete_padre IS NOT NULL) OR
        (tipo_paquete = 'SEPARAR' AND id_paquete_padre IS NULL) OR
        (tipo_paquete != 'SEPARAR' AND id_paquete_padre IS NULL)
    ),
    -- Check constraint: etiqueta_destinatario solo puede tener valor si tipo_paquete = SEPARAR y numero_guia IS NULL
    CONSTRAINT chk_etiqueta_destinatario CHECK (
        (tipo_paquete = 'SEPARAR' AND numero_guia IS NULL AND etiqueta_destinatario IS NOT NULL) OR
        (tipo_paquete = 'SEPARAR' AND numero_guia IS NOT NULL) OR
        (tipo_paquete != 'SEPARAR' AND etiqueta_destinatario IS NULL)
    ),
    -- Check constraint: id_agencia_destino solo puede tener valor si tipo_paquete = AGENCIA
    CONSTRAINT chk_agencia_destino CHECK (
        (tipo_paquete = 'AGENCIA' AND id_agencia_destino IS NOT NULL) OR
        (tipo_paquete != 'AGENCIA' AND id_agencia_destino IS NULL)
    )
);

-- Tabla ATENCION_PAQUETE
CREATE TABLE atencion_paquete (
    id_atencion BIGSERIAL PRIMARY KEY,
    id_paquete BIGINT NOT NULL,
    motivo TEXT NOT NULL,
    tipo_problema tipo_problema_atencion_enum NOT NULL,
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMP,
    estado estado_atencion_enum NOT NULL,
    observaciones_resolucion TEXT,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_atencion_paquete FOREIGN KEY (id_paquete) 
        REFERENCES paquete(id_paquete) ON DELETE RESTRICT,
    -- Check constraint: Si estado = RESUELTO, entonces fecha_resolucion debe tener valor
    CONSTRAINT chk_fecha_resolucion CHECK (
        (estado = 'RESUELTO' AND fecha_resolucion IS NOT NULL) OR
        (estado != 'RESUELTO')
    )
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_paquete_numero_guia ON paquete(numero_guia) WHERE numero_guia IS NOT NULL;
CREATE INDEX idx_paquete_estado ON paquete(estado);
CREATE INDEX idx_paquete_tipo_paquete ON paquete(tipo_paquete);
CREATE INDEX idx_paquete_id_paquete_padre ON paquete(id_paquete_padre);
CREATE INDEX idx_paquete_id_saca ON paquete(id_saca);
CREATE INDEX idx_paquete_id_recepcion ON paquete(id_recepcion);
CREATE INDEX idx_atencion_paquete_id_paquete ON atencion_paquete(id_paquete);
-- Índice único parcial: solo una solicitud activa por paquete
CREATE UNIQUE INDEX uk_atencion_paquete_activa ON atencion_paquete(id_paquete) WHERE activa = TRUE;
CREATE INDEX idx_saca_id_despacho ON saca(id_despacho);
CREATE INDEX idx_recepcion_id_agencia ON recepcion(id_agencia);

