# Fase 4.3 — Emergencias y Triage (CU10)

## Qué se revisó

### Backend

- **`TriageCreateRequest` / `TriageUpdateRequest`**: `admissionId` ya obligatorio (`@NotNull`). Signos vitales opcionales a nivel Jakarta (rangos cuando el valor viene informado).
- **`TriageService` / `TriageController`**: CRUD estándar; `list` opcionalmente por `admissionId`. La admisión se resolvía por repositorio; triage enlazado a `Admission` vía FK en entidad.
- **Entidad `Triage`**: prioridad obligatoria en BD; `targetMinutes` (tiempo objetivo); `registeredAt` en creación; sin `updatedAt`.
- **Prioridades**: `I_CRITICO`, `II_URGENTE`, `III_PRIORITARIO`, `IV_NO_URGENTE` (validación `@Pattern` en DTOs).
- **Signos vitales y rangos** (alineados backend): FC 0–300, FR 0–120, TA sistólica 0–300, diastólica 0–200, SpO₂ 0–100, temperatura 20–45 °C, dolor 0–10.
- **Paro cardiorrespiratorio (FA01)**: no hay columna ni flag en `triage` ni en el SQL de referencia para esta condición; no se añadió campo (restricción de fase).

### Frontend

- **Lista**: filtro por ID de admisión, búsqueda en tabla, columnas id / admisión-paciente / prioridad / fecha.
- **Formulario crear/editar**: admisión obligatoria en formulario; validadores opcionales por rango para vitales; select de prioridad mostraba solo el código.
- **Detalle**: muestra prioridad en crudo y vitales.

## Qué se modificó

### Backend (`TriageService`)

- **Admisión existente**: se mantiene la resolución por `admissionId`; si no existe → `ResourceNotFoundException` (404), mensaje ya existente.
- **Admisión `RECHAZADO`**: se rechaza **crear** y **actualizar** triage con `BusinessRuleException` (400) si el estado de la admisión es `RECHAZADO` (comparación case-insensitive, `trim`).
- **Auditoría de negocio** (`BusinessAuditRecorder.safeRecord`, módulo `triage`, entidad `Triage`):
  - **CREATE / UPDATE / DELETE** con payload mínimo en `previousData` / `newData`: `triageId`, `admissionId`, `priority`, `targetMinutes` (si aplica), `registeredAt` (ISO string si aplica). Sin síntomas ni texto clínico extenso.

### Frontend

- **Etiquetas de prioridad** (CU10): mapa `TRIAGE_PRIORITY_LABELS` y `triagePriorityLabel()`; select con código + descripción; lista con “píldora” de color por nivel; detalle con código + descripción.
- **Ordenación por prioridad**: `sortingDataAccessor` para ordenar I → II → III → IV (no alfabético por texto largo).
- **Búsqueda en tabla**: incluye el texto de la etiqueta de prioridad además del código.
- **Formulario**: `mat-hint` por vital con rangos alineados al backend; texto de contexto (admisión no `RECHAZADO`, recomendación CU10 de completar vitales sin volverlos obligatorios en cliente/API).
- **Mensajes de error**: errores de negocio y 404 siguen pasando por `getHttpErrorMessage` (mensaje del API en español).

## Qué no se modificó y por qué

- **Base de datos**: sin cambios (sin nuevas columnas; FA01 pendiente de diseño).
- **Contratos REST**: mismos paths, parámetros y nombres de campos JSON.
- **JWT, roles, seguridad**, **CU01**, **atención médica**, **pagos**, **farmacia**, **laboratorio**, **reportes**: fuera de alcance.
- **Estados de admisión**: no se añaden ni alteran transiciones globales; solo regla local “no triage si `RECHAZADO`”.
- **Signos vitales obligatorios en backend**: no se añadió `@NotNull` masivo en DTOs porque cambiaría el contrato implícito (hoy admite `null`), con riesgo para integraciones o datos históricos; documentado aquí como decisión conservadora.

## Estado final de CU10

| Aspecto | Estado |
| -------- | ------ |
| Contexto admisión (`admissionId` obligatorio + existencia) | Cumple (existente); 404 si ID inválido |
| Rechazo admisión `RECHAZADO` | Implementado en create/update |
| Prioridades estándar y visualización | Códigos API iguales; UI con etiquetas claras |
| Signos vitales y rangos | Backend sin cambios; frontend con hints y validación al informar valores |
| Tiempo objetivo (`targetMinutes`) | Sin cambios; audit incluye campo si viene informado |
| Paro cardiorrespiratorio (FA01) | **Pendiente** — no hay captura sin nuevo modelo/campo (no realizado en esta fase) |
| Auditoría negocio triage | CREATE / UPDATE / DELETE registrados con payload mínimo |

## Archivos modificados

- `backend/src/main/java/com/hospital/triage/service/TriageService.java`
- `frontend/src/app/features/triage/models/triage.models.ts`
- `frontend/src/app/features/triage/components/triage-form-dialog.component.ts`
- `frontend/src/app/features/triage/components/triage-form-dialog.component.html`
- `frontend/src/app/features/triage/components/triage-form-dialog.component.scss`
- `frontend/src/app/features/triage/pages/triage-list-page/triage-list-page.component.ts`
- `frontend/src/app/features/triage/pages/triage-list-page/triage-list-page.component.html`
- `frontend/src/app/features/triage/pages/triage-list-page/triage-list-page.component.scss`
- `frontend/src/app/features/triage/components/triage-detail-dialog.component.ts`
- `frontend/src/app/features/triage/components/triage-detail-dialog.component.html`
- `frontend/src/app/features/triage/components/triage-detail-dialog.component.scss`
- `docs/fase_4_3_emergencias_triage.md` (este documento)

## Resultado pruebas backend

- Comando: `mvn clean compile test` (directorio `backend/`).
- Resultado: **OK** (exit code 0, 2026-05-05).

## Resultado build frontend

- Comando: `npm run build` (directorio `frontend/`).
- Resultado: **OK** — `ng build` completó sin errores (exit code 0, 2026-05-05).

## Smoke manual (recomendado)

1. Crear triage con `admissionId` válido y distinto de `RECHAZADO` → 201 / guardado OK.
2. Crear/update con admisión inexistente → 404 recurso admisión.
3. Crear/update con admisión en `RECHAZADO` → 400 mensaje regla de negocio.
4. Enviar vitales fuera de rango → 400 validación.
5. Ver prioridad en lista/detalle/formulario como etiqueta + código en detalle/select.
6. Tras CREATE/UPDATE/DELETE, verificar entrada en bitácora de negocio (payload mínimo, sin síntomas largos).

## Riesgos pendientes

1. **FA01 / paro cardiorrespiratorio**: sin atributo en modelo actual; cualquier automatización protocolaria exige decisión funcional + probable cambio de esquema o uso de texto estructurado en síntomas (no aplicado aquí por restricciones).
2. **Obligatoriedad completa de signos vitales**: diferir hasta acordar impacto sobre datos legacy y clientes API.
3. **Edición que cambia admisión**: el API ya permitía mover triage entre admisiones si se cumple FK y reglas; la regla `RECHAZADO` ahora aplica igual al destino.

## Recomendación para Fase 5

- Definir **atención médica / continuidad del episodio** enlazando triage-admisión-consultas sin redundancia.
- Resolver **FA01** con modelo mínimo (p. ej. boolean o código en tabla existente sólo tras acuerdo y migración autorizada).
- Valorar **obligatoriedad de vitales** en DTO sólo después de política explícita y migración/control de registros incompletos.

---

## Addendum — Fase 9.3 (mayo 2026)

Ver **`docs/fase_9_3_operacion_clinica_integrada.md`**.

### Prioridad automática por signos vitales

En formulario **Nuevo / Editar triage**:

- Al cambiar FC, FR, PA sistólica/diastólica, SpO₂, temperatura o dolor → recalcula **prioridad I–IV** y **`targetMinutes`**.
- Campo prioridad **solo lectura**.
- Sin vitales válidos → **III_PRIORITARIO** (60 min).
- Utilidad: `frontend/.../triage/utils/triage-priority.util.ts`.

### Uso en flujos de prueba

- **Consulta programada:** triage **no** es obligatorio.
- **Emergencia** (`admision.tipo = EMERGENCIA`): triage **sí** — entre admisión y atención médica.
