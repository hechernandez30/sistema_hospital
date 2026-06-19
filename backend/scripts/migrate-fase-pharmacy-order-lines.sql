-- Fase farmacia — líneas de orden médica (CU13 / despacho con débito de stock)
-- Ejecutar sobre BD existente con esquema hospital antes de levantar el backend (ddl-auto: validate).
SET search_path TO hospital;

CREATE TABLE IF NOT EXISTS lineas_orden_farmacia (
    id_linea            BIGSERIAL PRIMARY KEY,
    id_orden            BIGINT NOT NULL REFERENCES ordenes_medicas(id_orden) ON DELETE CASCADE,
    id_medicamento      BIGINT NOT NULL REFERENCES medicamentos(id_medicamento),
    cantidad            INTEGER NOT NULL CHECK (cantidad > 0),
    CONSTRAINT uq_linea_orden_medicamento UNIQUE (id_orden, id_medicamento)
);

CREATE INDEX IF NOT EXISTS idx_lineas_orden_farmacia_orden
    ON lineas_orden_farmacia(id_orden);

CREATE INDEX IF NOT EXISTS idx_lineas_orden_farmacia_medicamento
    ON lineas_orden_farmacia(id_medicamento);
