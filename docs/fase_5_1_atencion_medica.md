# Fase 5.1 — Atención médica (CU12)

## Qué se revisó

### Backend

- **`MedicalCareCreateRequest` / `MedicalCareUpdateRequest`**: paciente y médico obligatorios (`@NotNull`); **`consultationReason`**, **`clinicalEvaluation`** y **`diagnosis`** obligatorios (`@NotBlank`); **`admissionId`** y **`appointmentId`** opcionales en tipos (`Long`).
- **`MedicalCareResponse`**: expone IDs de paciente, admisión opcional, cita opcional, médico y campos clínicos.
- **`MedicalCareService`**:
  - Resolución de paciente, staff (médico), admisión y cita por repositorios.
  - **Reglas previas**: si había **cita sin admisión**, se lanzaba error de negocio (“consulta programada requiere admisión”); **no** se rechazaba una atención con **paciente+médico** y sin admisión ni cita (hueco CU12 vs. modelo de episodio).
- **`MedicalCareController`**: CRUD estándar bajo `/api/medical-cares`; listado opcional por `patientId`.
- **Entidad `MedicalCare`**: admisión y cita **opcionales** en JPA (`ManyToOne` sin `nullable = false`).
- **`MedicalOrder`** (módulo separado): orden médica vinculada obligatoriamente a `MedicalCare`; listado/consultas por `medicalCareId` desde el propio controlador de órdenes. **Sin cambios** en esta fase (solo flujo existente).

### Frontend

- **Lista**: filtro por paciente, tabla con motivo/diagnosis recortados, etiquetas paciente/médico.
- **Formulario**: IDs texto con validadores; texto clínico con `Validators.required`; admisión/cita marcadas antes como “opcionales”.
- **Detalle**: muestra vínculos admisión/cita y texto completo motivo/evaluación/diagnóstico/plan.

## Qué se modificó

### Backend (`MedicalCareService`)

1. **Contexto episodio (CU12)**:
   - Se **exige admisión**: no se permite registrar ni actualizar atención si faltan **admisión y cita** (ambos nulos → `BusinessRuleException` 400 con mensaje claro).
   - Si solo hay **cita** (sin admisión) sigue rechazándose (“debe indicar también la admisión…”).
   - Si hay **cita**, su estado debe ser **PROGRAMADA** o **REPROGRAMADA** (“cita activa” alineado a `AppointmentService.ACTIVE_STATUS`).
2. **Auditoría de negocio** (`BusinessAuditRecorder`, módulo `medical-care`, entidad `MedicalCare`): **CREATE / UPDATE / DELETE** con payload **mínimo** (`medicalCareId`, `patientId`, `admissionId`/`appointmentId` cuando existan, `doctorId`, `careDate`). **Sin** motivo, evaluación, diagnóstico ni plan.
3. **DELETE**: igual que otros servicios, carga entidad antes de borrar para auditar estado previo.

### Frontend (`medical-care-form-dialog`)

1. Validador **a nivel grupo**: exige ID de admisión válido antes de guardar (`admissionOrAppointmentRequired`). Si hay cita pero no admisión (`appointmentRequiresAdmission`), bloqueo coherente con backend.
2. Textos UX: información CU12 sobre admisión obligatoria, cita opcional y estado de la cita; `mat-hint` en admisión/cita; errores contextualizados en SnackBar.
3. **Detalle**: texto explícito “Sin cita vinculada” cuando no hay `appointmentId` (solo claridad UI).

### Mensajes “al menos admisión **o** cita”

- Implementación efectiva por **persistencia actual y reglas de integridad ya existentes**: la **admisión es el ancla del episodio**; la **cita** es opcional y solo si está **PROGRAMADA / REPROGRAMADA**. Una **cita sin admisión no es un flujo soportado** (igual que antes, con mensajes revisados).

## Qué no se modificó y por qué

- **Base de datos**, **URLs**, **nombres de campos JSON**, **JWT**, **roles**, **CU01**.
- **Laboratorio, farmacia, pagos, reportes**: fuera de alcance.
- **Nuevo alta de órdenes médicas** desde pantalla atención: no se agregó; el módulo `medical-order` ya crea órdenes contra un `medicalCareId` existiente.
- **DTOs Jakarta**: `@NotBlank` ya cubría motivo/evaluación/diagnóstico — sin cambiar anotaciones.
- **`treatmentPlan`**: sigue opcional en API y BD.

## Estado final de CU12

| Requisito | Estado |
|-----------|--------|
| Vínculo a episodio (admisión) | Obligatorio vía API de negocio |
| Cita opcional | Sí; con estados PROGRAMADA / REPROGRAMADA |
| Cita sin admisión | No soportado (mensaje mejorado) |
| Motivo / evaluación / diagnóstico obligatorios | Sí (@NotBlank + formulario Angular) |
| Auditoría CREATE/UPDATE/DELETE sin PHI en bitácora | Sí |

## Archivos modificados

- `backend/src/main/java/com/hospital/medicalcare/service/MedicalCareService.java`
- `frontend/src/app/features/medical-cares/components/medical-care-form-dialog.component.ts`
- `frontend/src/app/features/medical-cares/components/medical-care-form-dialog.component.html`
- `frontend/src/app/features/medical-cares/components/medical-care-form-dialog.component.scss`
- `frontend/src/app/features/medical-cares/components/medical-care-detail-dialog.component.html`
- `docs/fase_5_1_atencion_medica.md`

## Resultado pruebas backend

- Comando: `mvn clean compile test` desde `backend/`.
- Resultado: **OK** (exit code 0).

## Resultado build frontend

- Comando: `npm run build` desde `frontend/`.
- Resultado: **OK** (exit code 0 — `ng build` completó sin errores).

## Smoke manual recomendado

1. Crear atención con **admisión válida** mismo paciente, motivo/evaluación/diagnóstico → **éxito**.
2. Crear con **admisión + cita** PROGRAMADA mismo paciente → **éxito**.
3. Sin admisión ni cita → **400** regla de negocio.
4. Cita sin admisión → **400**.
5. Cita en estado ATENDIDA / CANCELADA → **400** por estado.
6. Motivo/evaluación/diagnóstico vacíos → **400** validación.
7. Tras crear/editar/borrar, verificar auditoría (**sin** texto clínico en payload registrado).

## Riesgos pendientes

1. **Registros históricos** sin `admission_id` en BD podrían existir a nivel datos; nuevas saves exigen admisión solo en **servicio** — sin migración revisada en BD.
2. **Solo consulta externa sin admisión**: continúa impedido hasta definir proceso de alta de admisión o cambio de modelo.
3. **Órdenes médicas**: dependen de tener `MedicalCare`; flujo crear orden sigue siendo caso de uso aparte desde su pantalla/API.

## Recomendación para Fase 5.2

- Profundizar en **Órdenes médicas**: UX navegable desde contexto paciente/atención (sin duplicar lógica de tipos LAB/IMAGEN), o documentar flujo completo episodio → atención → orden → lab/farmacia.
- Valorar **listado/atenciones con contexto admitido**: columnas etiqueta admisión/fecha episodio (datos desde APIs existentes si no hay nueva agregación).
- Opcionalmente cubrir datos legacy con estrategia de migración (**fuera del alcance** hasta aprobación de BD).

---

## Addendum — Fase 9.3 (operación clínica integrada, mayo 2026)

Documentación detallada: **`docs/fase_9_3_operacion_clinica_integrada.md`**.

### Cambios posteriores a la fase original

1. **Auto-atención al admitir:** admisión en `PENDIENTE` / `ADMITIDO` / `TRANSFERIDO` crea atención con médico **MEDICO-JEFE** y textos `"Pendiente"`.
2. **Visibilidad por rol:** MEDICO-JEFE ve todas las atenciones; MEDICO solo las asignadas a su personal.
3. **Formulario nueva atención:** paciente filtrado por admisión abierta; médico con nombre + especialidad.
4. **Órdenes desde formulario:** checkboxes Lab / Imagen / Farmacia / Hospitalización al guardar.
5. **Edición:** secciones **Órdenes médicas** y **Exámenes** (lista + detalle al clic).
6. **Lista MEDICO-JEFE:** filas rojas/verdes según asignación; columna médico con nombre.

### Archivos adicionales (9.3)

- Backend: `MedicalCareService`, `ChiefMedicalDoctorResolver`, `MedicalCareAccessSupport`, `AdmissionService`
- Frontend: `medical-care-form-dialog.*`, `medical-care-list-page.*`, `entity-picker.utils.ts`, `medical-care-order-request.util.ts`, `medical-care-linked-orders.util.ts`
