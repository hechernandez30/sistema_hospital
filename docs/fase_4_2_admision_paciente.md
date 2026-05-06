# Fase 4.2 — Admisión de paciente (CU11)

## Qué se revisó

### Backend

- `AdmissionCreateRequest`, `AdmissionUpdateRequest`, `AdmissionResponse`, `AdmissionController`.
- `AdmissionService.mapCommon`: estados cuádruple catálogo, tipo CONSULTA|EMERGENCIA|HOSPITALIZACION, `financialValidationOk`, `validationSource` SEGURO|PAGO_SITIO, `ensureFinancialValidation` con bypass si estado **RECHAZADO**.
- Seguro vigente: `InsuranceRepository.findByPatient_Id`, activo + ventana `startDate`/`endDate` vs `LocalDate.now()`.
- Cita opcional: `appointmentId` → `resolveAppointment`.
- Auditoría ya existente (Fase 2) con payload reducido a `patientId` y `status` en CREATE.

### Frontend

- Lista (`admission-list-page`): `forkJoin` admisiones + pacientes para etiquetas.
- Formulario crear/editar, detalle, modelos (`ADMISSION_TYPES`, `STATUSES`, `VALIDATION_SOURCES`).

## Qué se modificó

### Backend — `AdmissionService`

1. **Identificación CU11** antes de financiero/cita  
   - Paciente debe estar **activo** (`Patient.isActive()`).  
   - Debe tener **DPI/NIT** y **código de paciente** no vacíos en expediente.

2. **Cita opcional y coherencia**  
   - Si `appointmentId` != null se exige que `appointment.patient.id` coincida con el `patientId`; evita vínculos cruzados **sin nuevo contrato**.

3. **Mensajes de validación financiera**  
   - Textos más explícitos para: validación OK obligatoria (salvo RECHAZADO), origen SEGURO vs PAGO_SITIO (pago en sitio / garantía administrativa), y seguro activo+vigencia.

4. **Auditoría (`BusinessAuditRecorder`)**  
   - Payload mínimo ampliado y **consistente** en CREATE / UPDATE / DELETE:  
     `admissionId`, `patientId`, opcional `appointmentId`, `admissionType`, `status`, `financialValidationOk`, `validationSource` (si viene).  
   - **Sin** observaciones ni campos narrativos.  
   - UPDATE: snapshot anterior con `toResponse(admission)` **antes** de `mapCommon`.  
   - DELETE: `toResponse` previo antes de borrar.

### Frontend

1. **`admission.models.ts`**  
   - `AdmissionDetailData` (lista + detalle).  
   - Mapas `ADMISSION_*_LABELS`, `VALIDATION_SOURCE_LABELS` para UI sin cambiar valores API.

2. **Formulario**  
   - Hints CU11 / financiero / regla de cita.  
   - Sección “Financiero CU11”; selects con etiquetas humanas.

3. **Validación cliente** antes de POST/PUT  
   - Si estado efectivo ≠ `RECHAZADO`: exige checkbox financiero marcado **y** origen SEGURO o PAGO_SITIO.

4. **Lista**  
   - Columna **Cobertura** (resumen texto).  
   - Chips estado + tipo por color; mejor etiqueta tipo/estado.  
   - Filtro incluye financiero y `appointmentId`; `sortingDataAccessor` mejorado.

5. **Detalle**  
   - Nombre paciente si disponible desde lista; texto explicativo cita opcional/coherencia servidor.

6. **Estilos**  
   - `admission-ui.styles.scss`, `admission-chip-class.ts`.

## Qué no se modificó y por qué

- **Base de datos**, **contratos REST**, **nombres de campo**, **JWT**, **roles/SecurityConfig**.
- **Sin nuevos estados** financieros (sigue SEGURO / PAGO_SITIO únicamente).
- **Sin flujo fuerte automático citas ↔ admisión** (solo validación cuando se informa ID cita).
- **Sin cambios en módulos de pagos** (solo significado documentado/UI de PAGO_SITIO como garantía registrada procesalmente).
- **CU01**, triage, atención, farmacia, laboratorio, reportes, portal (fuera de alcance).

## Estado final de CU11

- Admisión requiere paciente existente **y** uso administrativo coherentemente identificado (**activo + código + DPI/NIT** según expediente).
- Cobertura: SEGURO con póliza **activa+y vigente** en sistema **o** PAGO_SITIO; RECHAZADO libera exigencias financieras.
- Opcional vínculo a cita con **comprobación de paciente** en servidor.
- UX con catálogos legibles; auditoría con metadatos mínimos pero útiles sin datos sensibles.

## Archivos modificados o nuevos

| Archivo |
|---------|
| `backend/.../admission/service/AdmissionService.java` |
| `frontend/.../admissions/models/admission.models.ts` |
| `frontend/.../admissions/admission-ui.styles.scss` *(nuevo)* |
| `frontend/.../admissions/admission-chip-class.ts` *(nuevo)* |
| `frontend/.../admissions/components/admission-form-dialog.component.ts/html/scss` |
| `frontend/.../admissions/components/admission-detail-dialog.component.ts/html/scss` |
| `frontend/.../admissions/pages/admission-list-page/...ts/html/scss` |
| `docs/fase_4_2_admision_paciente.md` |

## Resultado pruebas backend

`mvn clean compile test` desde `backend/` → **exit code 0**.

## Resultado build frontend

`npm run build` desde `frontend/` → **exit code 0**.

## Smoke test manual (intranet — documentación)

| Caso | Esperado |
|------|----------|
| Admisión con SEGURO y póliza vigente | Persiste si `financialValidationOk` y estado no RECHAZADO. |
| Admisión con PAGO_SITIO | Persiste si validación marcada + origen PAGO_SITIO. |
| Sin seguro ni pago válido si origen SEGURO | Rechazo 400 servidor. |
| Sin validación marcada/origen sin RECHAZADO | Rechazo 400 servidor + cliente. |
| Paciente inexistente | 404. |
| Paciente inactivo o expediente incompleto | 400 nueva reglas. |
| Estado ALTA / TRANSFERIDO desde edición | Misma política financiera si no es RECHAZADO. |
| Cita otro paciente | 400 regla nueva. |
| CRUD auditoría | Eventos admissions con nuevo payload mínimo. |

## Riesgos pendientes

1. **Datos legados**: pacientes inactivos pero con admisiones antiguas; nuevas admissiones rechazarán hasta reactivación.
2. **PAGO_SITIO** sigue siendo marca administrativa: no garantiza cobro real hasta integración futura con pagos.
3. **`@Future` citas**: no tocado aquí.

## Recomendación para Fase 4.3

Según plan del hospital, la siguiente oleada típica sería **Triage CU** o primera **Atención** (solo si el orden en `AGENTS.md`/roadmap lo confirma), con uso de esta admisión como contexto pero sin duplicar reglas financieras. Opcional más adelante: selector guiado paciente desde lista/cache (solo GET existentes); no requiere DDL.
