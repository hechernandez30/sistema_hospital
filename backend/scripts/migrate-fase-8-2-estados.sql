-- Fase 8.2 — Migración controlada (ejecutar sobre BD existente hospital)
SET search_path TO hospital;

ALTER TABLE roles ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE especialidades ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE admisiones DROP CONSTRAINT IF EXISTS admisiones_estado_check;
ALTER TABLE admisiones ADD CONSTRAINT admisiones_estado_check
    CHECK (estado IN ('PENDIENTE', 'ADMITIDO', 'ALTA', 'TRANSFERIDO', 'RECHAZADO', 'ANULADO'));

ALTER TABLE laboratorio DROP CONSTRAINT IF EXISTS laboratorio_estado_check;
ALTER TABLE laboratorio ADD CONSTRAINT laboratorio_estado_check
    CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'RECHAZADO', 'ANULADO'));

ALTER TABLE imagenes DROP CONSTRAINT IF EXISTS imagenes_estado_check;
ALTER TABLE imagenes ADD CONSTRAINT imagenes_estado_check
    CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'RECHAZADO', 'ANULADO'));
