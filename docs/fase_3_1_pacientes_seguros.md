# Fase 3.1 — Registro de paciente y seguros (CU02 / RN07)

## Alcance revisado

### Backend — Pacientes

- `PatientCreateRequest`, `PatientUpdateRequest`, `PatientController`: sin cambio de rutas ni nombres de campos.
- `PatientService`: revisión de reglas DPI/NIT y código duplicado; alta/baja/consulta con carga explícita de entidad antes de borrar para auditoría.
- El script de referencia `hospital_postgresql_15_tablas_es.sql` del repositorio incluye `CHECK` de teléfonos de paciente como **8 dígitos** locales (Guatemala), alineado con DTOs; no implica migraciones Flyway adicionales nombradas en esta fase.

### Backend — Seguros

- `InsuranceRequest` / `InsuranceResponse`, `InsuranceController` (`/api/patients/{patientId}/insurances`): mismos endpoints y contratos.
- `InsuranceService`: auditoría de negocio en CREATE/UPDATE/DELETE.

### Frontend — Pacientes

- Lista, formulario crear/editar, detalle (`PatientDetailDialogComponent`).
- Confirmación de privaciedad obligatoria en **creación** (`Validators.requiredTrue` + POST con `privacyAccepted` según casilla); enlace independiente abre modal con texto legal (`PrivacyNoticeDialogComponent`, `environment.privacyNotice`).
- Validaciones CU02 ya alineadas (nombres, teléfono, correo, fecha de nacimiento, DPI/NIT).
- Sugerencia de código `PAC-nnnn` existente + botón **Renovar sugerencia** que avanza el correlativo tratando el código actual como “ocupado” (solo UI; el contrato sigue exigiendo `patientCode` en el body).

### Frontend — Seguros

- Encapsulamiento de llamadas REST existentes en `PatientApiService` (list/create/update/delete bajo `/api/patients/{id}/insurances`).
- UI mínima en el **detalle del paciente**: listado, alta/edición/eliminación vía diálogo (solo roles que ya mutan pacientes: admin, médico, recepción). Cajeros u otros con solo lectura de pacientes ven el listado sin acciones de mutación.

## Qué se modificó

### Mensajes de reglas de negocio (paciente)

Textos más explícitos para duplicados de código y DPI/NIT (misma clase de error HTTP 400, mismo campo `message` en `ApiErrorResponse`).

### Auditoría de negocio (`BusinessAuditRecorder`)

- **Pacientes** (`PatientService`): CREATE, UPDATE, DELETE con payloads mínimos: `patientId`, `patientCode`, `dpiNitMasked`, `active`. Sin texto clínico ni contacto completo.
- **Seguros** (`InsuranceService`): CREATE, UPDATE, DELETE con `patientId`, `insuranceId`, `insurerName`, `policyNumberMasked`, `coveragePercent`, `active`. Sin número de póliza completo en bitácora.
- Helper `AuditPayloadMask.tailMask()` en `com.hospital.auditlog` para sufijo enmascarado reutilizable.

### Angular

- `patient-insurance.models.ts`, `patient-insurance-form-dialog.*`: formulario crear/editar seguro usando el mismo payload que `InsuranceRequest`.
- `PatientApiService`: métodos de seguros contra endpoints existentes.
- `PatientDetailDialogComponent`: sección “Seguros (RN07)” con carga, reintento ante error y acciones condicionadas por `ROLES_PATIENTS_MUTATE`.
- `PatientFormDialogComponent` / `.html` / `.scss`: hints DPI/NIT, botón renovar código sugerido.
- `patient-list-page`: diálogo de detalle un poco más ancho (`720px`) para acomodar la sección de seguros.
- `backend/doc/API.md`: ejemplo de mensaje de regla de negocio para código duplicado actualizado al nuevo texto.

## Qué no se modificó y por qué

- **Migraciones Flyway numeradas en esta fase**: requisito explícito de no introducir cambios adicionales más allá del script de referencia ya versionado en repo.
- **Contratos REST** (rutas, nombres de campos JSON, códigos de estado): solo se mejoró el contenido textual de algunos mensajes `400`; la forma de la respuesta no cambia.
- **JWT, login, CU01**, citas, admisiones, triage, atención, pagos, farmacia y reportes: fuera de alcance.
- **Validación automática de seguro en pagos**: no implementada (restricción).
- Perfiles **CAJERO** no recibieron permisos extra para mutar seguros: se mantiene el mismo principio que en lista de pacientes (solo vista si el rol permite ver pacientes).

## Estado final de CU02 (Registro de paciente)

- Alta con privacidad obligatoria en API (`@AssertTrue` + casilla en UI); lectura del aviso vía modal no sustituye el marcado de la casilla (documentado en CU02 FA03 / `docs/cu02_aviso_privacidad_modal.md`).
- DPI/NIT y código siguen únicos a nivel servidor; mensajes más claros en conflicto.
- Teléfono (exactamente **8** dígitos 0–9, sin `+` ni código de país), correo, fecha de nacimiento y nombres alineados con validaciones Jakarta + espejo en Angular.
- Código de paciente: entrada manual conservada; sugerencia y “Renovar sugerencia” solo en cliente (sin cambiar contrato).

## Estado de RN07 (Seguro del paciente)

- Los datos de póliza y cobertura se gestionan en intranet en el contexto del expediente (`/api/patients/{id}/insurances`), con UI mínima en detalle del paciente.
- No se enlaza aquí validación contra aseguradora ni automatismos en pagos (pendiente para fases posteriores según roadmap).

## Archivos modificados o nuevos

| Ruta |
|------|
| `backend/src/main/java/com/hospital/auditlog/AuditPayloadMask.java` (nuevo) |
| `backend/src/main/java/com/hospital/patient/service/PatientService.java` |
| `backend/src/main/java/com/hospital/insurance/service/InsuranceService.java` |
| `backend/doc/API.md` |
| `frontend/src/app/features/patients/models/patient-insurance.models.ts` (nuevo) |
| `frontend/src/app/features/patients/services/patient-api.service.ts` |
| `frontend/src/app/features/patients/components/patient-insurance-form-dialog.component.ts` (nuevo) |
| `frontend/src/app/features/patients/components/patient-insurance-form-dialog.component.html` (nuevo) |
| `frontend/src/app/features/patients/components/patient-insurance-form-dialog.component.scss` (nuevo) |
| `frontend/src/app/features/patients/components/patient-detail-dialog.component.ts` |
| `frontend/src/app/features/patients/components/patient-detail-dialog.component.html` |
| `frontend/src/app/features/patients/components/patient-detail-dialog.component.scss` |
| `frontend/src/app/features/patients/pages/patient-list-page/patient-list-page.component.ts` |
| `frontend/src/app/features/patients/components/patient-form-dialog.component.ts` |
| `frontend/src/app/features/patients/components/patient-form-dialog.component.html` |
| `frontend/src/app/features/patients/components/patient-form-dialog.component.scss` |
| `frontend/src/app/features/patients/components/privacy-notice-dialog.component.ts` (nuevo) |
| `frontend/src/app/features/patients/components/privacy-notice-dialog.component.html` (nuevo) |
| `frontend/src/app/features/patients/components/privacy-notice-dialog.component.scss` (nuevo) |
| `frontend/src/environments/environment.ts` |
| `frontend/src/environments/environment.development.ts` |
| `docs/cu02_aviso_privacidad_modal.md` (nuevo) |
| `docs/fase_3_1_pacientes_seguros.md` |

## Pruebas obligatorias — resultados

Comandos ejecutados (Windows, PowerShell):

- Backend: `mvn clean compile test` desde `backend/` — **exit code 0** (todas las pruebas del proyecto pasaron).
- Frontend: `npm run build` desde `frontend/` — **exit code 0**; artefacto en `frontend/dist/hospital-web`.

## Smoke test manual (intranet)

| Escenario | Resultado esperado |
|-----------|---------------------|
| Crear paciente válido | `201`; listado actualizado; detalle muestra datos. |
| DPI/NIT duplicado | `400` con mensaje que indica expediente existente / revisar número; snackbar muestra el mensaje del servidor. |
| Privacidad no aceptada | Formulario Angular bloquea envío; API rechaza si `privacyAccepted` es falso/null; abrir modal no marca la casilla. |
| Teléfono/correo inválidos | Validación cliente + Jakarta en servidor. |
| Crear/editar/eliminar seguro | Desde **Ver detalle** del paciente con rol que muta; usa POST/PUT/DELETE existentes. |
| Listar seguros | GET al abrir detalle; cajero puede ver sin botones si no tiene rol de mutación. |

## Riesgos pendientes

- **Mensajes de negocio**: clientes externos que parseaban el texto exacto de “El código de paciente ya existe” deben adaptarse (el formato JSON no cambió).
- **Auditoría**: si `AuditLogService` falla, la operación principal sigue; solo se registra advertencia en log (comportamiento ya definido en `BusinessAuditRecorder`).
- **Concurrencia de código PAC-***: la sugerencia en frontend puede colisionar si dos usuarios alta simultánea; mitigación habitual: reintento tras error 400 de código duplicado.

## Recomendación para Fase 3.2

- Definir si **CAJERO** (o otros) deben registrar seguros desde recepción; si sí, amplío de autorización debe ser decisión explícita de seguridad (no realizada aquí).
- Valorar enlace UX entre **admisión**/pago y póliza activa una vez autorizada la automatización RN07 en pagos.
- Revisión de documentación CU02 en manual de usuario interno para reflejar la nueva sección de seguros en detalle del paciente.
