# Fase 9.3 — Operación clínica integrada (admisión → atención → órdenes → exámenes)

**Fecha:** 30 de mayo de 2026  
**Alcance:** Cambios operativos recientes que enlazan admisión, atención médica, órdenes, laboratorio, imágenes, roles **MEDICO-JEFE** / **MEDICO**, permisos, citas por correo y triage automático.  
**Base para:** diagramas de flujo, manuales por rol y escenarios E2E posteriores.

---

## 1. Resumen ejecutivo

| Área | Cambio principal |
|------|------------------|
| **Admisión** | Al crear admisión en `PENDIENTE`, `ADMITIDO` o `TRANSFERIDO`, se genera automáticamente una **atención médica pendiente** asignada al **MEDICO-JEFE**. |
| **Atención médica** | Filtro de pacientes por admisión abierta; órdenes desde checkboxes; en **edición**, secciones de **Órdenes médicas** y **Exámenes** (lista + detalle al clic). |
| **Roles clínicos** | **MEDICO-JEFE** ve todas las atenciones y reasigna; **MEDICO** solo las suyas. |
| **Órdenes médicas** | Al crear orden `LABORATORIO` o `IMAGEN`, el backend crea registro pendiente en lab/imagen. |
| **Laboratorio** | Correlativo de expediente `AAAA-MM-DD-CC-NNNNNNN` al auto-crear desde orden (ya no `"Pendiente"`). |
| **Triage** | Prioridad I–IV calculada automáticamente según signos vitales. |
| **Citas** | Confirmación por **Gmail** (asíncrona); eliminados checks SMS/WhatsApp en UI. |
| **Permisos** | Recepcionista y médico pueden **leer** personal/especialidades para pickers operativos. |

---

## 2. Rol MEDICO-JEFE

### Definición

- Rol en BD: **`MEDICO-JEFE`** (JWT: `ROLE_MEDICO-JEFE`).
- Debe existir **exactamente un** usuario activo con este rol.
- Ese usuario debe tener **personal** vinculado, tipo **`MEDICO`**, activo.

### Resolución backend

- `ChiefMedicalDoctorResolver`: obtiene el `staffId` del jefe médico.
- Si no hay jefe, hay más de uno, o el personal no es válido → **400** al admitir (bloquea auto-atención).

### Visibilidad de atenciones

| Rol | Listado / detalle atenciones |
|-----|------------------------------|
| **ADMINISTRADOR** | Todas |
| **MEDICO-JEFE** | Todas |
| **MEDICO** | Solo donde `doctorId` = su registro de personal |

Implementación: `MedicalCareAccessSupport` + filtros en `MedicalCareService` y `MedicalCareController`.

### UI lista (MEDICO-JEFE)

- Filas **rojas**: atención asignada al propio jefe (pendiente de reasignar).
- Filas **verdes**: atención asignada a otro médico.
- Columna médico con **nombre** (no solo ID).

---

## 3. Flujo: admisión → atención automática

### Disparador

Al **crear** admisión (`POST /api/admissions`) si el estado inicial ∈ `{ PENDIENTE, ADMITIDO, TRANSFERIDO }`:

1. Se persiste la admisión.
2. Se crea **una** atención médica vinculada (`MedicalCareService.ensurePendingForAdmission`).
3. **Idempotente:** no duplica si ya existe atención para esa admisión.

### Valores de la atención auto-creada

| Campo | Valor |
|-------|--------|
| `patientId` | Paciente de la admisión |
| `admissionId` | Admisión recién creada |
| `appointmentId` | Cita de la admisión (si venía vinculada) o `null` |
| `doctorId` | Personal del **MEDICO-JEFE** |
| `consultationReason` | `"Pendiente"` |
| `clinicalEvaluation` | `"Pendiente"` |
| `diagnosis` | `"Pendiente"` |
| `treatmentPlan` | `null` |
| `requiresHospitalization` | `false` |

### Responsabilidad operativa

1. **Recepcionista** admite al paciente.
2. **MEDICO-JEFE** ve la atención en lista (fila roja), **reasigna** al médico tratante.
3. **MEDICO** edita la atención y completa datos clínicos.

### Archivos clave

- `AdmissionService` (post-create)
- `AdmissionStatusRules.AUTO_MEDICAL_CARE_STATUSES`
- `MedicalCareService.ensurePendingForAdmission`
- `ChiefMedicalDoctorResolver`

---

## 4. Formulario de atención médica (CU12)

### Nueva atención — selector de paciente

Solo aparecen pacientes con **al menos una admisión** en:

- `PENDIENTE`
- `ADMITIDO`
- `TRANSFERIDO`

Estados excluidos: `ALTA`, `RECHAZADO`, `ANULADO`.

Utilidad frontend: `buildPatientOptionsForMedicalCare()` en `entity-picker.utils.ts`.

### Selector de admisión

Mismo criterio de estados abiertos para el paciente seleccionado.

### Campo médico

Opciones con **nombre + especialidad** (`buildDoctorOptions`).

### Estudios / exámenes adicionales (alta y edición)

Checkboxes al guardar:

- Laboratorio → orden `LABORATORIO`
- Imagenología → orden `IMAGEN`
- Farmacia → orden `FARMACIA`
- Hospitalización → orden `HOSPITALIZACION` + flag `requiresHospitalization`

Cada orden nueva: `status = PENDIENTE`, `priority = NORMAL`.  
En edición no se duplican tipos que ya tengan orden activa (excluye `ANULADO`, `COMPLETADO`, `RECHAZADO`).

### Edición — secciones inferiores (solo modo editar)

#### Órdenes médicas

- Listado compacto: `#ID · Tipo · Estado`
- Color según estado (pendiente / en proceso / completado / cerrado)
- Clic en fila → panel de detalle (tipo, prioridad, fecha, descripción, observaciones)
- Segundo clic → oculta detalle

#### Exámenes

- Listado unificado de registros **laboratorio** e **imagen** vinculados a órdenes de esta atención
- Clic → detalle (resultado, informe, fechas, adjunto si aplica)

Utilidad: `buildExamsForOrders()` en `medical-care-linked-orders.util.ts`.

---

## 5. Órdenes médicas y fulfillment automático

### Creación desde atención

Frontend: `medical-care-order-request.util.ts` + `MedicalOrderApiService` tras guardar atención.

### Auto-registro lab / imagen (backend)

Al crear orden (`MedicalOrderService.create`):

| `orderType` | Acción |
|-------------|--------|
| `LABORATORIO` | `LaboratoryService.ensurePendingRecordForMedicalOrder` |
| `IMAGEN` | `ImagingStudyService.ensurePendingRecordForMedicalOrder` |
| Otros | Sin registro automático |

**Idempotente:** no duplica si ya existe registro para la orden.

### Valores iniciales registro laboratorio (auto)

| Campo | Valor |
|-------|--------|
| `requesterType` | `INTERNO` |
| `requestType` | `null` |
| `recordNumber` | **Correlativo** `AAAA-MM-DD-LQ-NNNNNNN` (ver §6) |
| `sampleDescription`, `incident`, `result` | `"Pendiente"` |
| `status` | `PENDIENTE` |

### Valores iniciales registro imagen (auto)

| Campo | Valor |
|-------|--------|
| `studyType` | `"Pendiente"` |
| `status` | `PENDIENTE` |
| Demás campos opcionales | vacíos / null |

---

## 6. Correlativo de expediente laboratorio (CU06 RN02/RN03)

### Formato

`AAAA-MM-DD-CC-NNNNNNN`

- **CC:** `MM` si `requestType = MUESTRA_MEDICA`; **`LQ`** en caso contrario (incluye auto-create desde atención).
- **NNNNNNN:** secuencia de 7 dígitos por día y CC.

### Generación

- **Frontend** (alta manual en módulo Laboratorio): `nextLabRecordNumberFromExisting()` en `next-sequential-code.ts`.
- **Backend** (auto-create desde orden): `LaboratoryRecordNumberGenerator.nextFromExisting()` consultando expedientes existentes.

### Corrección aplicada

Antes, `ensurePendingRecordForMedicalOrder` asignaba `"Pendiente"` en `recordNumber`, rompiendo el correlativo.  
Ahora usa el mismo algoritmo que la UI manual.

---

## 7. Triage — prioridad automática (CU10)

Al ingresar o modificar signos vitales en **Nuevo / Editar triage**:

- Se evalúa cada parámetro (FC, FR, PA sistólica/diastólica, SpO₂, temperatura, dolor).
- Se toma la categoría **más grave** (I → IV).
- Campo **Prioridad** en solo lectura.
- Se actualiza **`targetMinutes`** (0 / 15 / 60 / 120 según CU10 RN03).
- Sin vitales válidos → default **III_PRIORITARIO** (60 min).

Utilidad: `triage-priority.util.ts` → `computeTriagePriorityFromVitals()`.

### Cuándo usar triage en pruebas

| Escenario | ¿Triage? |
|-----------|----------|
| Consulta programada (cita + admisión CONSULTA) | **No** |
| Emergencia (admisión EMERGENCIA) | **Sí** — paso entre admisión y atención |

---

## 8. Citas — correo Gmail (CU04)

### UI

- Un solo checkbox: **“Enviar confirmación por correo al paciente”**.
- Eliminados **Notificar SMS** y **Notificar WhatsApp** del formulario.

### Backend

- Spring Mail + SMTP Gmail (`smtp.gmail.com:587`).
- Credenciales en `application-local.yml` (ignorado por Git) o variables `MAIL_USERNAME`, `MAIL_PASSWORD`.
- Envío **asíncrono** (`@Async`) tras commit: la API responde de inmediato; fallos de correo no revierten la cita.
- Eventos: crear, editar, cancelar (si `notifyEmail = true` y paciente tiene email).

---

## 9. Permisos HTTP actualizados (SecurityConfig)

Resumen de cambios relevantes para operación clínica:

| Recurso | GET | POST/PUT/DELETE |
|---------|-----|-----------------|
| `/api/staff/**` | Admin, RRHH, **Recepcionista**, **Médico**, **MEDICO-JEFE** | Admin, RRHH |
| `/api/specialties/**` | Idem staff | Admin, RRHH |
| `/api/admissions/**` | + Médico, MEDICO-JEFE, Cajero | Recepcionista, Admin |
| `/api/medical-cares/**` | + Cajero, Lab, Farmacia | Médico, **MEDICO-JEFE**, Admin |
| `/api/medical-orders/**` | + Lab, Cajero | Médico, **MEDICO-JEFE**, Farmacia, Admin |
| `/api/medications/**` | + **Médico**, **MEDICO-JEFE** (GET) | Farmacia, Admin |
| `/api/laboratory/**` | + **MEDICO-JEFE** | Lab, Médico, MEDICO-JEFE, Admin |
| `/api/imaging/**` | + **MEDICO-JEFE** | Médico, MEDICO-JEFE, Admin |

Frontend: constante `ROLES_STAFF_SPECIALTY_READ` para catálogos en citas, admisiones y atenciones.

---

## 10. Flujos de prueba documentados

### A. Consulta externa con seguro (sin triage)

```
Recepcionista: Paciente → Seguro → Cita → Admisión CONSULTA
     ↓ (auto)
Atención pendiente → MEDICO-JEFE reasigna → Médico completa atención + órdenes
     ↓
Lab / Imagen / Farmacia → Cajero pago → Cita ATENDIDA → Admisión ALTA
```

### B. Emergencia (con triage)

```
Recepcionista: Admisión EMERGENCIA
     ↓ (auto)
Atención pendiente (MEDICO-JEFE)
Recepcionista: Triage (signos vitales → prioridad auto)
MEDICO-JEFE: Reasigna atención
Médico: Atención + órdenes urgentes → resto del flujo
```

### C. Demo rápida (~30 min)

Usar flujo **A** con un paciente de prueba; **no incluye triage**.

---

## 11. Archivos principales tocados

### Backend

- `admission/service/AdmissionService.java`
- `admission/AdmissionStatusRules.java`
- `medicalcare/ChiefMedicalDoctorResolver.java`
- `medicalcare/MedicalCareAccessSupport.java`
- `medicalcare/service/MedicalCareService.java`
- `medicalorder/service/MedicalOrderService.java`
- `laboratory/service/LaboratoryService.java`
- `laboratory/support/LaboratoryRecordNumberGenerator.java`
- `imaging/service/ImagingStudyService.java`
- `security/config/SecurityConfig.java`
- `appointment/mail/*` (notificaciones Gmail)

### Frontend

- `features/medical-cares/components/medical-care-form-dialog.*`
- `features/medical-cares/pages/medical-care-list-page.*`
- `features/medical-cares/utils/medical-care-linked-orders.util.ts`
- `features/medical-cares/utils/medical-care-order-request.util.ts`
- `features/shared/entity-picker.utils.ts`
- `features/triage/utils/triage-priority.util.ts`
- `features/appointments/components/appointment-form-dialog.*`
- `core/constants/role-routes.ts`

---

## 12. Pendientes / no incluidos en esta fase

- Cierre formal de episodio (`CERRADA` en admisión) — ver Fase 9.1 propuesta.
- Sincronización automática estado orden ↔ lab/imagen.
- Notificación al médico cuando lab completa resultado.
- Corrección retroactiva de registros lab con `recordNumber = "Pendiente"` (edición manual).
- FA01 paro cardiorrespiratorio en triage (sin columna en BD).

---

## 13. Referencias cruzadas

| Documento | Contenido relacionado |
|-----------|------------------------|
| `fase_4_2_admision_paciente.md` | Addendum auto-atención |
| `fase_4_3_emergencias_triage.md` | Addendum prioridad automática |
| `fase_4_1_citas_consultas.md` | Addendum correo Gmail |
| `fase_5_1_atencion_medica.md` | Addendum roles, formulario, órdenes |
| `fase_5_2_ordenes_laboratorio_muestras.md` | Addendum auto-fulfillment y correlativo |
| `fase_9_escenarios_e2e_roles_estados_cierre.md` | Escenarios E2E actualizados |
| `backend/doc/API.md` | Rol MEDICO-JEFE y permisos GET ampliados |
