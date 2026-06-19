-- =========================================================
-- PROYECTO: SISTEMA HOSPITALARIO PRIVADO
-- MOTOR: PostgreSQL
-- VERSIÓN REDUCIDA (15 TABLAS)
-- Nombres en español
-- =========================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS hospital;
SET search_path TO hospital;

-- =========================================================
-- 1. ROLES
-- =========================================================
CREATE TABLE IF NOT EXISTS roles (
    id_rol              BIGSERIAL PRIMARY KEY,
    nombre              VARCHAR(50) NOT NULL UNIQUE,
    descripcion         VARCHAR(200),
    activo              BOOLEAN NOT NULL DEFAULT TRUE
);

-- =========================================================
-- 2. USUARIOS
-- =========================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario          BIGSERIAL PRIMARY KEY,
    id_rol              BIGINT NOT NULL REFERENCES roles(id_rol),
    username            VARCHAR(100) NOT NULL UNIQUE,
    correo              VARCHAR(150) NOT NULL UNIQUE,
    clave               VARCHAR(255) NOT NULL,
    nombres             VARCHAR(100) NOT NULL,
    apellidos           VARCHAR(100) NOT NULL,
    estado              VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
                            CHECK (estado IN ('ACTIVO', 'BLOQUEADO', 'DESHABILITADO')),
    usa_mfa             BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion      TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_usuario_correo
        CHECK (correo ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

-- =========================================================
-- 3. ESPECIALIDADES
-- =========================================================
CREATE TABLE IF NOT EXISTS especialidades (
    id_especialidad     BIGSERIAL PRIMARY KEY,
    nombre              VARCHAR(100) NOT NULL UNIQUE,
    duracion_minutos    INTEGER NOT NULL DEFAULT 30 CHECK (duracion_minutos BETWEEN 20 AND 60),
    activo              BOOLEAN NOT NULL DEFAULT TRUE
);

-- =========================================================
-- 4. PERSONAL
-- =========================================================
CREATE TABLE IF NOT EXISTS personal (
    id_personal             BIGSERIAL PRIMARY KEY,
    id_usuario              BIGINT UNIQUE REFERENCES usuarios(id_usuario),
    id_especialidad         BIGINT REFERENCES especialidades(id_especialidad),
    tipo_personal           VARCHAR(30) NOT NULL
                                CHECK (tipo_personal IN ('MEDICO', 'ENFERMERIA', 'ADMINISTRATIVO', 'LABORATORIO', 'FARMACIA', 'CONTABILIDAD', 'RRHH')),
    codigo_empleado         VARCHAR(30) NOT NULL UNIQUE,
    numero_colegiado        VARCHAR(50),
    horario                 VARCHAR(100),
    asistencia              VARCHAR(20) DEFAULT 'PRESENTE'
                                CHECK (asistencia IN ('PRESENTE', 'AUSENTE', 'PERMISO', 'VACACIONES')),
    activo                  BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_contratacion      DATE
);

-- =========================================================
-- 5. PACIENTES
-- =========================================================
CREATE TABLE IF NOT EXISTS pacientes (
    id_paciente                 BIGSERIAL PRIMARY KEY,
    codigo_paciente             VARCHAR(30) NOT NULL UNIQUE,
    nombres                     VARCHAR(100) NOT NULL,
    apellidos                   VARCHAR(100) NOT NULL,
    dpi_nit                     VARCHAR(30) NOT NULL UNIQUE,
    fecha_nacimiento            DATE NOT NULL,
    sexo                        VARCHAR(10) CHECK (sexo IN ('M', 'F', 'OTRO')),
    telefono                    VARCHAR(20),
    correo                      VARCHAR(150),
    direccion                   TEXT,
    contacto_emergencia_nombre  VARCHAR(150),
    contacto_emergencia_telefono VARCHAR(20),
    acepta_privacidad           BOOLEAN NOT NULL DEFAULT FALSE,
    alergias                    TEXT,
    padecimientos               TEXT,
    antecedentes                TEXT,
    medicamentos_actuales       TEXT,
    activo                      BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion              TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion         TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_paciente_correo
        CHECK (correo IS NULL OR correo ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
    CONSTRAINT chk_paciente_telefono
        CHECK (telefono IS NULL OR telefono ~ '^[0-9]{8}$'),
    CONSTRAINT chk_paciente_contacto_emergencia_telefono
        CHECK (contacto_emergencia_telefono IS NULL OR contacto_emergencia_telefono ~ '^[0-9]{8}$')
);

-- =========================================================
-- 6. SEGUROS
-- Simplificada: aquí se guarda la afiliación del paciente
-- =========================================================
CREATE TABLE IF NOT EXISTS seguros (
    id_seguro               BIGSERIAL PRIMARY KEY,
    id_paciente             BIGINT NOT NULL REFERENCES pacientes(id_paciente) ON DELETE CASCADE,
    aseguradora             VARCHAR(150) NOT NULL,
    numero_poliza           VARCHAR(50) NOT NULL,
    porcentaje_cobertura    NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (porcentaje_cobertura BETWEEN 0 AND 100),
    fecha_inicio            DATE,
    fecha_fin               DATE,
    activo                  BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (id_paciente, numero_poliza)
);

-- =========================================================
-- 7. CITAS
-- =========================================================
CREATE TABLE IF NOT EXISTS citas (
    id_cita                 BIGSERIAL PRIMARY KEY,
    id_paciente             BIGINT NOT NULL REFERENCES pacientes(id_paciente),
    id_medico               BIGINT NOT NULL REFERENCES personal(id_personal),
    id_especialidad         BIGINT REFERENCES especialidades(id_especialidad),
    fecha_hora_inicio       TIMESTAMP NOT NULL,
    fecha_hora_fin          TIMESTAMP NOT NULL,
    motivo                  VARCHAR(250),
    estado                  VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADA'
                                CHECK (estado IN ('PROGRAMADA', 'REPROGRAMADA', 'CANCELADA', 'ATENDIDA', 'NO_ASISTIO')),
    notificar_email         BOOLEAN NOT NULL DEFAULT FALSE,
    notificar_sms           BOOLEAN NOT NULL DEFAULT FALSE,
    notificar_whatsapp      BOOLEAN NOT NULL DEFAULT FALSE,
    creado_por              BIGINT REFERENCES usuarios(id_usuario),
    fecha_creacion          TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion     TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (fecha_hora_fin > fecha_hora_inicio)
);

-- =========================================================
-- 8. ADMISIONES
-- Incluye admisión, alta y transferencia en una sola tabla
-- =========================================================
CREATE TABLE IF NOT EXISTS admisiones (
    id_admision                 BIGSERIAL PRIMARY KEY,
    id_paciente                 BIGINT NOT NULL REFERENCES pacientes(id_paciente),
    id_cita                     BIGINT REFERENCES citas(id_cita),
    tipo_ingreso                VARCHAR(20) NOT NULL
                                    CHECK (tipo_ingreso IN ('CONSULTA', 'EMERGENCIA', 'HOSPITALIZACION')),
    estado                      VARCHAR(20) NOT NULL DEFAULT 'ADMITIDO'
                                    CHECK (estado IN ('PENDIENTE', 'ADMITIDO', 'ALTA', 'TRANSFERIDO', 'RECHAZADO', 'ANULADO')),
    area_actual                 VARCHAR(100),
    habitacion                  VARCHAR(30),
    validacion_financiera_ok    BOOLEAN NOT NULL DEFAULT FALSE,
    fuente_validacion           VARCHAR(20)
                                    CHECK (fuente_validacion IN ('SEGURO', 'PAGO_SITIO')),
    observaciones               TEXT,
    fecha_ingreso               TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_alta                  TIMESTAMP,
    area_transferida            VARCHAR(100),
    admitido_por                BIGINT REFERENCES usuarios(id_usuario)
);

-- =========================================================
-- 9. TRIAGE
-- =========================================================
CREATE TABLE IF NOT EXISTS triage (
    id_triage                   BIGSERIAL PRIMARY KEY,
    id_admision                 BIGINT NOT NULL REFERENCES admisiones(id_admision) ON DELETE CASCADE,
    frecuencia_cardiaca         SMALLINT,
    frecuencia_respiratoria     SMALLINT,
    presion_sistolica           SMALLINT,
    presion_diastolica          SMALLINT,
    saturacion_oxigeno          NUMERIC(5,2),
    temperatura                 NUMERIC(4,1),
    dolor                       SMALLINT CHECK (dolor BETWEEN 0 AND 10),
    sintomas                    TEXT,
    prioridad                   VARCHAR(20) NOT NULL
                                    CHECK (prioridad IN ('I_CRITICO', 'II_URGENTE', 'III_PRIORITARIO', 'IV_NO_URGENTE')),
    tiempo_objetivo_minutos     INTEGER,
    id_personal_responsable     BIGINT REFERENCES personal(id_personal),
    fecha_registro              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 10. ATENCIONES MEDICAS
-- Aquí se concentra atención, diagnóstico, indicaciones y resumen clínico
-- =========================================================
CREATE TABLE IF NOT EXISTS atenciones_medicas (
    id_atencion                 BIGSERIAL PRIMARY KEY,
    id_paciente                 BIGINT NOT NULL REFERENCES pacientes(id_paciente),
    id_admision                 BIGINT REFERENCES admisiones(id_admision),
    id_cita                     BIGINT REFERENCES citas(id_cita),
    id_medico                   BIGINT NOT NULL REFERENCES personal(id_personal),
    motivo_consulta             TEXT NOT NULL,
    evaluacion_clinica          TEXT NOT NULL,
    diagnostico                 TEXT NOT NULL,
    plan_tratamiento            TEXT,
    requiere_hospitalizacion    BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_atencion              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 11. ORDENES MEDICAS
-- Centraliza laboratorio, imágenes, farmacia y hospitalización
-- =========================================================
CREATE TABLE IF NOT EXISTS ordenes_medicas (
    id_orden                    BIGSERIAL PRIMARY KEY,
    id_atencion                 BIGINT NOT NULL REFERENCES atenciones_medicas(id_atencion) ON DELETE CASCADE,
    tipo_orden                  VARCHAR(20) NOT NULL
                                    CHECK (tipo_orden IN ('LABORATORIO', 'IMAGEN', 'FARMACIA', 'HOSPITALIZACION')),
    descripcion                 TEXT NOT NULL,
    prioridad                   VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    estado                      VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                                    CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'RECHAZADO', 'PARCIAL', 'ANULADO')),
    observaciones               TEXT,
    fecha_orden                 TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 11b. LINEAS ORDEN FARMACIA (despacho / CU13)
-- =========================================================
CREATE TABLE IF NOT EXISTS lineas_orden_farmacia (
    id_linea                    BIGSERIAL PRIMARY KEY,
    id_orden                    BIGINT NOT NULL REFERENCES ordenes_medicas(id_orden) ON DELETE CASCADE,
    id_medicamento              BIGINT NOT NULL REFERENCES medicamentos(id_medicamento),
    cantidad                    INTEGER NOT NULL CHECK (cantidad > 0),
    CONSTRAINT uq_linea_orden_medicamento UNIQUE (id_orden, id_medicamento)
);

CREATE INDEX IF NOT EXISTS idx_lineas_orden_farmacia_orden ON lineas_orden_farmacia(id_orden);

-- =========================================================
-- 12. LABORATORIO
-- Incluye muestras y resultados en una sola tabla
-- =========================================================
CREATE TABLE IF NOT EXISTS laboratorio (
    id_laboratorio              BIGSERIAL PRIMARY KEY,
    id_orden                    BIGINT NOT NULL UNIQUE REFERENCES ordenes_medicas(id_orden) ON DELETE CASCADE,
    tipo_solicitante            VARCHAR(20) CHECK (tipo_solicitante IN ('INTERNO', 'EXTERNO')),
    tipo_solicitud              VARCHAR(20) CHECK (tipo_solicitud IN ('MUESTRA_MEDICA', 'LABORATORIO')),
    numero_expediente           VARCHAR(40),
    descripcion_muestra         TEXT,
    muestra_recibida            BOOLEAN NOT NULL DEFAULT FALSE,
    muestra_valida              BOOLEAN,
    incidencia                  TEXT,
    resultado                   TEXT,
    adjunto                     TEXT,
    estado                      VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                                    CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'RECHAZADO', 'ANULADO')),
    fecha_recepcion             TIMESTAMP,
    fecha_resultado             TIMESTAMP,
    id_personal_responsable     BIGINT REFERENCES personal(id_personal)
);

-- =========================================================
-- 13. IMAGENES
-- =========================================================
CREATE TABLE IF NOT EXISTS imagenes (
    id_imagen                   BIGSERIAL PRIMARY KEY,
    id_orden                    BIGINT NOT NULL UNIQUE REFERENCES ordenes_medicas(id_orden) ON DELETE CASCADE,
    tipo_estudio                VARCHAR(100) NOT NULL,
    fecha_programada            TIMESTAMP,
    fecha_realizada             TIMESTAMP,
    informe_resultado           TEXT,
    archivo_resultado           TEXT,
    estado                      VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                                    CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'RECHAZADO', 'ANULADO')),
    id_personal_responsable     BIGINT REFERENCES personal(id_personal)
);

-- =========================================================
-- 14. MEDICAMENTOS
-- Inventario simple incluido en esta misma tabla
-- =========================================================
CREATE TABLE IF NOT EXISTS medicamentos (
    id_medicamento              BIGSERIAL PRIMARY KEY,
    nombre                      VARCHAR(150) NOT NULL,
    presentacion                VARCHAR(100),
    unidad                      VARCHAR(30),
    stock_actual                INTEGER NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo                INTEGER NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    activo                      BOOLEAN NOT NULL DEFAULT TRUE
);

-- =========================================================
-- 15. PAGOS
-- Simplificada: reúne cobro, seguro aplicado y comprobante
-- =========================================================
CREATE TABLE IF NOT EXISTS pagos (
    id_pago                     BIGSERIAL PRIMARY KEY,
    id_paciente                 BIGINT NOT NULL REFERENCES pacientes(id_paciente),
    id_admision                 BIGINT REFERENCES admisiones(id_admision),
    id_orden                    BIGINT REFERENCES ordenes_medicas(id_orden),
    concepto                    VARCHAR(200) NOT NULL,
    subtotal                    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    porcentaje_seguro           NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (porcentaje_seguro BETWEEN 0 AND 100),
    descuento_seguro            NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (descuento_seguro >= 0),
    copago                      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (copago >= 0),
    total_pagar                 NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_pagar >= 0),
    metodo_pago                 VARCHAR(20) CHECK (metodo_pago IN ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA')),
    estado                      VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                                    CHECK (estado IN ('PENDIENTE', 'PAGADO', 'ANULADO')),
    numero_recibo               VARCHAR(50) UNIQUE,
    fecha_pago                  TIMESTAMP DEFAULT NOW(),
    registrado_por              BIGINT REFERENCES usuarios(id_usuario)
);

-- =========================================================
-- 16. BITACORA
-- Auditoría transversal del sistema
-- =========================================================
CREATE TABLE IF NOT EXISTS bitacora (
    id_bitacora                 BIGSERIAL PRIMARY KEY,
    id_usuario                  BIGINT REFERENCES usuarios(id_usuario),
    modulo                      VARCHAR(100) NOT NULL,
    entidad                     VARCHAR(100) NOT NULL,
    id_registro                 VARCHAR(100) NOT NULL,
    accion                      VARCHAR(100) NOT NULL,
    datos_anteriores            JSONB,
    datos_nuevos                JSONB,
    fecha_evento                TIMESTAMP NOT NULL DEFAULT NOW(),
    direccion_ip                INET
);

-- =========================================================
-- ÍNDICES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_pacientes_dpi_nit ON pacientes(dpi_nit);
CREATE INDEX IF NOT EXISTS idx_pacientes_nombre ON pacientes(apellidos, nombres);
CREATE INDEX IF NOT EXISTS idx_citas_medico_fecha ON citas(id_medico, fecha_hora_inicio);
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON citas(id_paciente);
CREATE INDEX IF NOT EXISTS idx_admisiones_paciente ON admisiones(id_paciente);
CREATE INDEX IF NOT EXISTS idx_atenciones_paciente ON atenciones_medicas(id_paciente);
CREATE INDEX IF NOT EXISTS idx_ordenes_tipo_estado ON ordenes_medicas(tipo_orden, estado);
CREATE INDEX IF NOT EXISTS idx_pagos_paciente ON pagos(id_paciente);
CREATE INDEX IF NOT EXISTS idx_bitacora_modulo_fecha ON bitacora(modulo, fecha_evento);

-- =========================================================
-- RESTRICCIÓN SIMPLE PARA EVITAR CHOQUE EXACTO DE CITAS
-- =========================================================
CREATE UNIQUE INDEX IF NOT EXISTS uq_cita_medico_hora
ON citas(id_medico, fecha_hora_inicio)
WHERE estado IN ('PROGRAMADA', 'REPROGRAMADA');

-- =========================================================
-- TRIGGERS DE FECHA ACTUALIZACIÓN
-- =========================================================
CREATE OR REPLACE FUNCTION fn_actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuarios_fecha_actualizacion ON usuarios;
CREATE TRIGGER trg_usuarios_fecha_actualizacion
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_fecha_modificacion();

DROP TRIGGER IF EXISTS trg_pacientes_fecha_actualizacion ON pacientes;
CREATE TRIGGER trg_pacientes_fecha_actualizacion
BEFORE UPDATE ON pacientes
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_fecha_modificacion();

DROP TRIGGER IF EXISTS trg_citas_fecha_actualizacion ON citas;
CREATE TRIGGER trg_citas_fecha_actualizacion
BEFORE UPDATE ON citas
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_fecha_modificacion();

-- =========================================================
-- DATOS BÁSICOS
-- =========================================================
INSERT INTO roles (nombre, descripcion) VALUES
('ADMINISTRADOR', 'Administración general del sistema'),
('MEDICO', 'Atención médica y expediente clínico'),
('RECEPCIONISTA', 'Registro, admisión y agenda'),
('CAJERO', 'Pagos y seguros'),
('FARMACIA', 'Despacho de medicamentos'),
('LABORATORIO', 'Procesamiento de laboratorio'),
('RRHH', 'Gestión de personal'),
('AUDITOR', 'Consulta de bitácora')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO especialidades (nombre, duracion_minutos) VALUES
('Medicina General', 30),
('Pediatría', 30),
('Ginecología', 40),
('Cardiología', 45),
('Radiología', 30)
ON CONFLICT (nombre) DO NOTHING;

COMMIT;

-- =========================================================
-- MIGRACIÓN FASE 8.2 (bases ya creadas — ejecutar manualmente si aplica)
-- =========================================================
-- ALTER TABLE hospital.roles ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
-- ALTER TABLE hospital.especialidades ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
-- ALTER TABLE hospital.admisiones DROP CONSTRAINT IF EXISTS admisiones_estado_check;
-- ALTER TABLE hospital.admisiones ADD CONSTRAINT admisiones_estado_check
--     CHECK (estado IN ('PENDIENTE', 'ADMITIDO', 'ALTA', 'TRANSFERIDO', 'RECHAZADO', 'ANULADO'));
-- ALTER TABLE hospital.laboratorio DROP CONSTRAINT IF EXISTS laboratorio_estado_check;
-- ALTER TABLE hospital.laboratorio ADD CONSTRAINT laboratorio_estado_check
--     CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'RECHAZADO', 'ANULADO'));
-- ALTER TABLE hospital.imagenes DROP CONSTRAINT IF EXISTS imagenes_estado_check;
-- ALTER TABLE hospital.imagenes ADD CONSTRAINT imagenes_estado_check
--     CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'RECHAZADO', 'ANULADO'));

-- =========================================================
-- NOTAS DE DISEÑO
-- 1. Se redujo a 15 tablas principales.
-- 2. Se fusionaron:
--    - historial clínico en pacientes
--    - horarios/asistencia en personal
--    - muestras/resultados en laboratorio
--    - inventario básico en medicamentos
--    - cobro/factura/seguro en pagos
-- 3. Imágenes y laboratorio se mantienen separadas porque
--    en tus CU tienen funcionamiento distinto.
-- =========================================================
