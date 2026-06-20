# Fase 9.1 — Mejora UX de formularios: selectores y autocomplete

## Resumen ejecutivo

Se reemplazaron los campos de entrada manual de IDs internos en los formularios críticos del flujo E2E por un componente reutilizable `app-entity-autocomplete` (Angular Material + `ControlValueAccessor`). El formulario reactivo sigue almacenando y enviando **IDs numéricos como string**; la UI muestra etiquetas legibles (nombre, fechas, estados, tipos).

- **Backend:** no modificado (sin cambios en DTOs, endpoints ni reglas de negocio).
- **Base de datos:** no modificada.
- **Frontend:** componente compartido + utilidades de etiquetado/filtrado + 8 diálogos de formulario.
- **Build:** `npm run build` — **OK** (13 s, advertencia de budget SCSS en portal público, sin relación con esta fase).
- **Maven:** no ejecutado (`mvn clean compile test` no aplica; backend sin cambios).

---

## Componentes compartidos (nuevos)

| Archivo | Rol |
|---------|-----|
| `frontend/src/app/features/shared/entity-picker.models.ts` | Modelo `EntityPickerOption` (id, label, sublabel, searchText) |
| `frontend/src/app/features/shared/entity-picker.utils.ts` | Builders y filtros (pacientes activos, médicos, admisiones, citas, atenciones, órdenes) |
| `frontend/src/app/features/shared/entity-autocomplete.component.*` | Autocomplete CVA; guarda ID en el control del formulario |

---

## Formularios modificados

| Módulo | Componente | Campos reemplazados |
|--------|------------|---------------------|
| Citas | `appointment-form-dialog` | `patientId`, `doctorId` |
| Admisiones | `admission-form-dialog` | `patientId`, `appointmentId` (opcional) |
| Triage | `triage-form-dialog` | `admissionId` |
| Atención médica | `medical-care-form-dialog` | `patientId`, `doctorId`, `admissionId`, `appointmentId` (opc.) |
| Órdenes médicas | `medical-order-form-dialog` | `medicalCareId` |
| Laboratorio | `laboratory-form-dialog` | `medicalOrderId` (solo alta) |
| Imágenes | `imaging-form-dialog` | `medicalOrderId` (solo alta) |
| Pagos | `payment-form-dialog` | `patientId`, `admissionId` (opc.), `medicalOrderId` (opc.) |

---

## Detalle por selector

### Citas — paciente (`patientId`)

- **Muestra:** nombre completo; sublabel: código paciente, DPI/NIT, `#id`.
- **Búsqueda:** nombre, apellido, DPI/NIT, código, id.
- **Envía:** `patientId` (entero).
- **Filtro:** solo pacientes `active === true`.

### Citas — médico (`doctorId`)

- **Muestra:** código empleado — Médico · especialidad; sublabel: licencia, `#id`.
- **Búsqueda:** código, especialidad, licencia, id.
- **Envía:** `doctorId` (= `staffId`).
- **Filtro:** `staffType === 'MEDICO'` y activos.

### Admisiones — paciente / cita

- **Paciente:** igual que citas.
- **Cita opcional:** fecha/hora, paciente, médico (código), estado; solo `PROGRAMADA` / `REPROGRAMADA` del paciente seleccionado.
- **Envía:** `patientId`, `appointmentId` (opcional).

### Triage — admisión (`admissionId`)

- **Muestra:** `Adm. #n — Nombre paciente`; sublabel: tipo ingreso, estado, fecha.
- **Envía:** `admissionId`.
- **Filtro:** excluye `RECHAZADO` y `ANULADO`.

### Atención médica

- **Paciente (9.3):** solo pacientes con admisión **PENDIENTE**, **ADMITIDO** o **TRANSFERIDO** (`buildPatientOptionsForMedicalCare`).
- **Médico (9.3):** nombre + especialidad en etiqueta (`buildDoctorOptions`).
- **Admisión:** contexto del paciente; estados abiertos PENDIENTE/ADMITIDO/TRANSFERIDO (en edición conserva admisión actual).
- **Cita opcional:** citas activas del paciente (o del paciente de la admisión seleccionada).
- **Edición (9.3):** secciones listado **Órdenes médicas** y **Exámenes** (lab/imagen) con detalle al clic.
- **Envía:** `patientId`, `doctorId`, `admissionId`, `appointmentId` (opc.); checkboxes generan órdenes al guardar.

### Orden médica — atención (`medicalCareId`)

- **Muestra:** `Atención #n — Paciente`; sublabel: fecha, diagnóstico recortado (60 caracteres).
- **Envía:** `medicalCareId`.
- **Nota:** diagnóstico acotado para contexto; no se añade información clínica extra.

### Laboratorio / Imágenes — orden (`medicalOrderId`, solo create)

- **Muestra:** `Orden #n — Tipo`; sublabel: paciente, estado, fecha, descripción corta.
- **Envía:** `medicalOrderId`.
- **Filtro laboratorio:** `orderType === 'LABORATORIO'`, estado ≠ `ANULADO`.
- **Filtro imágenes:** `orderType === 'IMAGEN'`, estado ≠ `ANULADO`.

### Pagos

- **Paciente:** como citas.
- **Admisión opcional:** del paciente; sin `RECHAZADO`/`ANULADO`.
- **Orden opcional:** órdenes del paciente (vía atención médica); sin `ANULADO`.
- **Envía:** `patientId`, `admissionId`, `medicalOrderId` según formulario.

---

## Endpoints reutilizados (GET list existentes)

| Servicio Angular | Método | Uso |
|------------------|--------|-----|
| `PatientApiService` | `list()` | Pacientes |
| `StaffApiService` | `list()` | Médicos |
| `SpecialtyApiService` | `list()` | Etiqueta especialidad en médicos |
| `AppointmentApiService` | `list()` | Citas |
| `AdmissionApiService` | `list()` | Admisiones |
| `MedicalCareApiService` | `list()` | Atenciones y vínculo orden→paciente |
| `MedicalOrderApiService` | `list()` | Órdenes (lab/imagen/pagos) |

No se crearon endpoints nuevos ni métodos backend adicionales.

---

## Métodos / servicios frontend

- **Nuevos:** utilidades y componente en `features/shared/` (ver arriba).
- **Sin cambios** en firmas de API services existentes; solo consumo de `list()` ya disponible.

---

## Backend modificado

**No.** Sin cambios en Java, SQL, DTOs ni validaciones de servidor.

---

## Resultado de compilación

```text
npm run build  →  OK (exit 0)
mvn clean compile test  →  N/A (backend no tocado)
```

---

## Smoke test (manual, documentado)

Ejecutar con backend y frontend en desarrollo, usuario con permisos de módulos asistenciales/facturación.

| # | Acción | Resultado esperado |
|---|--------|-------------------|
| 1 | Nueva cita: buscar paciente por nombre / DPI / código | Se selecciona por autocomplete; POST envía `patientId` correcto |
| 2 | Nueva cita: buscar médico por nombre/código/especialidad | POST envía `doctorId` correcto |
| 3 | Nueva admisión: seleccionar paciente | `patientId` en payload |
| 4 | Admisión: asociar cita opcional del paciente | Solo citas PROGRAMADA/REPROGRAMADA; `appointmentId` opcional |
| 5 | Nuevo triage: seleccionar admisión | No aparecen ANULADO/RECHAZADO; `admissionId` correcto |
| 6 | Nueva atención: paciente + admisión válida | Sin admisiones cerradas; IDs correctos |
| 7 | Nueva orden: seleccionar atención | `medicalCareId` correcto |
| 8 | Nuevo laboratorio: orden tipo LABORATORIO | Sin órdenes ANULADAS ni otros tipos |
| 9 | Nueva imagen: orden tipo IMAGEN | Igual criterio de filtro |
| 10 | Nuevo pago: paciente + admisión u orden opcional | Sin registros ANULADOS en listas; IDs en payload |
| 11 | Verificar que ANULADOS no son seleccionables en flujos nuevos | Listas filtradas en frontend |
| 12 | Editar registros existentes | Valores precargados visibles en autocomplete |

**Estado en esta entrega:** checklist definido para ejecución manual previa a E2E finales; no automatizado en CI en esta fase.

---

## Pendientes / no cubierto

- Formularios fuera del flujo E2E prioritario (usuarios, personal, medicamentos, seguros, bitácora, etc.) siguen con sus controles actuales.
- `responsibleStaffId` / `registeredByUserId` en laboratorio, imágenes y pagos: siguen como ID manual u opcional.
- Búsqueda server-side paginada: no implementada; listas completas filtradas en cliente (aceptable para entorno académico/dev).
- Portal público CU01, login/JWT: sin cambios (restricción respetada).

---

## Archivos tocados (resumen)

**Nuevos**

- `frontend/src/app/features/shared/entity-picker.models.ts`
- `frontend/src/app/features/shared/entity-picker.utils.ts`
- `frontend/src/app/features/shared/entity-autocomplete.component.ts`
- `frontend/src/app/features/shared/entity-autocomplete.component.html`
- `frontend/src/app/features/shared/entity-autocomplete.component.scss`
- `docs/fase_9_1_mejora_ux_selectores_autocomplete.md`

**Modificados**

- `frontend/src/app/features/appointments/components/appointment-form-dialog.component.*`
- `frontend/src/app/features/admissions/components/admission-form-dialog.component.*`
- `frontend/src/app/features/triage/components/triage-form-dialog.component.*`
- `frontend/src/app/features/medical-cares/components/medical-care-form-dialog.component.*`
- `frontend/src/app/features/medical-orders/components/medical-order-form-dialog.component.*`
- `frontend/src/app/features/laboratory/components/laboratory-form-dialog.component.*`
- `frontend/src/app/features/imaging/components/imaging-form-dialog.component.*`
- `frontend/src/app/features/payments/components/payment-form-dialog.component.*`
