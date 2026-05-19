-- Datos semilla OPCIONALES para desarrollo (PostgreSQL).
-- Ejecutar manualmente DESPUÉS de `hospital_postgresql_15_tablas_es.sql` si se desea un paciente de prueba adicional.
-- No modifica el script principal del repositorio.

BEGIN;

SET search_path TO hospital;

INSERT INTO pacientes (
    codigo_paciente,
    nombres,
    apellidos,
    dpi_nit,
    fecha_nacimiento,
    sexo,
    telefono,
    correo,
    acepta_privacidad,
    activo
)
SELECT
    'DEV-001',
    'Paciente',
    'Desarrollo',
    'DEV-DPI-0000000001',
    DATE '1995-06-15',
    'M',
    '55550001',
    'dev.paciente@example.com',
    TRUE,
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM pacientes WHERE codigo_paciente = 'DEV-001');

COMMIT;
