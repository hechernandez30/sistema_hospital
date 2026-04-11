# Casos de Uso - Sistema Hospitalario Privado

## Descripción general
Este sistema gestiona la operación de un hospital privado, cubriendo desde el ingreso del paciente hasta su atención médica, diagnósticos, farmacia, pagos y auditoría.

El sistema contempla dos formas de ingreso:
- Con cita programada
- Por emergencia

Regla crítica:
Un paciente solo puede ser atendido si:
- Tiene seguro válido, o
- Realiza pago en sitio

De lo contrario, la admisión es rechazada.

---

## Módulos principales

- Portal Web
- Gestión de Usuarios
- Gestión de Pacientes
- Agenda y Citas
- Admisiones
- Emergencias y Triage
- Atención Médica
- Órdenes Médicas
- Laboratorio
- Imágenes Médicas
- Farmacia e Inventario
- Pagos y Seguros
- Reportes
- Bitácora (Auditoría)
- Recursos Humanos

---

## Casos de uso resumidos

### CU01 - Portal Web
Permite a los usuarios consultar información general del hospital.

Funciones:
- Consulta de servicios
- Búsqueda de información
- Registro de visitas (analítica básica)

---

### CU02 - Registro de Paciente
Permite registrar pacientes en el sistema.

Incluye:
- Datos personales
- Datos de contacto
- Historial médico básico
- Contacto de emergencia

Validaciones:
- DPI/NIT único
- Correo válido
- Teléfono válido

---

### CU03 - Gestión de Usuarios
Permite administrar usuarios del sistema.

Funciones:
- Crear usuario
- Asignar rol
- Activar/desactivar usuario
- Control de acceso por rol

Roles:
- Administrador
- Médico
- Recepción
- Farmacia
- Laboratorio
- Cajero
- RRHH

---

### CU04 - Gestión de Citas
Permite administrar citas médicas.

Funciones:
- Crear cita
- Reprogramar
- Cancelar
- Asignación automática según disponibilidad

Incluye:
- Médico
- Especialidad
- Fecha y hora

Notificaciones:
- Email
- SMS
- WhatsApp

---

### CU05 - Reglas de Negocio
Define validaciones generales del sistema.

Incluye:
- Validación de seguro o pago
- Control de estados
- Restricciones de acceso
- Reglas de flujo clínico

---

### CU06 - Muestras Médicas
Permite gestionar solicitudes de muestras.

Funciones:
- Registro de solicitud
- Identificación de paciente
- Control de tipo de muestra

Estados:
- Pendiente
- En proceso
- Completado
- Rechazado

---

### CU07 - Laboratorio
Gestiona estudios de laboratorio.

Flujo:
- Recepción de muestra
- Validación de muestra
- Procesamiento
- Registro de resultados

Validaciones:
- Muestra válida
- Repetición si hay error

Salida:
- Resultado en expediente clínico

---

### CU08 - Reportes
Genera reportes del sistema.

Tipos:
- Ocupación hospitalaria
- Finanzas
- Atención por especialidad

Exportación:
- PDF
- Excel

---

### CU09 - Pagos y Seguros
Gestiona cobros del sistema.

Funciones:
- Validar seguro
- Calcular cobertura
- Registrar pagos

Métodos:
- Efectivo
- Tarjeta
- Transferencia

Estados:
- Pendiente
- Pagado
- Anulado

---

### CU10 - Emergencias y Triage
Gestiona pacientes de emergencia.

Flujo:
- Ingreso inmediato
- Evaluación de signos vitales
- Clasificación por prioridad

Niveles:
- Crítico
- Urgente
- Prioritario
- No urgente

Resultado:
- Atención inmediata o espera

---

### CU11 - Admisión de Paciente
Permite el ingreso del paciente al hospital.

Flujo:
1. Identificación del paciente
2. Validación financiera

Decisión:
- Seguro válido → Admitir
- Pago en sitio → Admitir
- Ninguno → Rechazar

Estados:
- Admitido
- Alta
- Transferido
- Rechazado

---

### CU12 - Atención Médica
Permite registrar la consulta médica.

Incluye:
- Motivo de consulta
- Evaluación clínica
- Diagnóstico
- Plan de tratamiento

Salida:
- Generación de órdenes médicas

---

### CU13 - Farmacia e Inventario
Gestiona medicamentos.

Funciones:
- Control de stock
- Despacho de medicamentos
- Actualización de inventario

Validaciones:
- Stock suficiente
- Despacho parcial si aplica

Alertas:
- Stock bajo

---

### CU14 - Recursos Humanos
Gestiona personal del hospital.

Funciones:
- Registro de personal
- Control de horarios
- Control de asistencia

Tipos:
- Médico
- Enfermería
- Administrativo

---

### CU15 - Bitácora (Auditoría)
Registra acciones del sistema.

Incluye:
- Usuario
- Acción realizada
- Módulo afectado
- Fecha y hora

Objetivo:
- Trazabilidad
- Seguridad
- Cumplimiento

---

## Flujo general del sistema

1. Paciente ingresa:
   - Por cita o emergencia

2. Se valida:
   - Seguro o pago

3. Se admite al paciente

4. Se realiza triage (si aplica)

5. Médico realiza atención

6. Se generan órdenes:
   - Laboratorio
   - Imágenes
   - Farmacia

7. Se ejecutan órdenes

8. Se registran resultados

9. Se realiza cobro

10. Se registra en bitácora

---

## Consideraciones clave

- Todo proceso debe quedar registrado
- El expediente clínico es central
- Las órdenes médicas conectan todos los módulos
- La validación financiera es obligatoria
- El sistema debe permitir trazabilidad completa