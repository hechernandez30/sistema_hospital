# Fase 4.1b — CU04 FA02: disponibilidad del médico (Opción A, mínima)

**Fecha propuesta:** 2026-05-21  
**Estado:** Implementado (2026-05-21)

## Objetivo

Cumplir **FA02 — Médico no disponible** del CU04 de forma **mínima**, usando solo campos ya existentes en `personal` (`activo`, `asistencia`, `tipo_personal`), **sin cambios de base de datos**, **sin nuevos endpoints** y **sin motor de turnos** (CU14 completo queda para otra fase).

## Alcance

### Incluye

| Capa | Cambio |
|------|--------|
| **Backend** | Rechazar alta/edición de citas **activas** si el médico no está operativamente disponible |
| **Frontend** | No ofrecer médicos no disponibles al **crear** cita; en **edición**, permitir ver el médico actual aunque ya no esté disponible (para poder cambiarlo) |
| **Agenda** | Columnas/filtros de médicos en agenda alineados al mismo criterio (solo médicos disponibles para nuevas citas) |
| **Documentación** | Este archivo + nota breve en `fase_4_1_citas_consultas.md` |

### No incluye (fuera de Opción A)

- Tablas de turnos, bloqueos por fecha, horario recurrente (CU14 RN02–RN05).
- Campo **sala** ni validación médico+sala del CU.
- Sugerencia automática de “médicos alternativos” (solo mensaje de error claro).
- Cambiar citas ya guardadas cuando el médico pasa a vacaciones (solo se bloquea **nueva** programación / reprogramación activa).
- Notificaciones 24 h.

## Regla de negocio (RN operativa FA02)

Un médico está **disponible para citas** si y solo si:

1. `tipo_personal = 'MEDICO'`
2. `activo = true`
3. `asistencia = 'PRESENTE'`

**Valores que bloquean cita:** `AUSENTE`, `PERMISO`, `VACACIONES`.

**`asistencia` nula o vacía:** tratar como `PRESENTE` (coherente con default SQL y datos históricos).

La validación aplica cuando la cita queda en estado **PROGRAMADA** o **REPROGRAMADA** (mismos estados que ya participan en solapamiento). Si el estado es `CANCELADA`, `ATENDIDA` o `NO_ASISTIO`, no exigir disponibilidad del médico (permite cierres administrativos).

## Comportamiento esperado (pruebas FA02)

| Escenario | Resultado esperado |
|-----------|-------------------|
| Médico activo, asistencia **PRESENTE** | Permite crear/editar cita activa |
| Médico **VACACIONES** (activo=true) | **No** aparece en selector nueva cita; **400** si se envía el ID por API |
| Médico **AUSENTE** o **PERMISO** | Igual que vacaciones |
| Médico **inactivo** (`activo=false`) | Igual (refuerzo backend; UI ya filtra parcialmente) |
| Cita existente; médico pasa a vacaciones; **editar** solo motivo sin cambiar médico/estado activo | **400** al guardar si sigue PROGRAMADA/REPROGRAMADA con ese médico |
| Cambiar médico en edición a uno **PRESENTE** | Permite guardar |
| Cambiar estado a **CANCELADA** con médico en vacaciones | Permite (no validar disponibilidad) |
| FA01 solapamiento | Sin cambios; sigue aplicando además de FA02 |

## Cambios técnicos propuestos

### 1. Backend (único punto obligatorio de verdad)

**Archivo:** `AppointmentService.java`

**Nuevo método privado** (nombre orientativo):

```text
validateDoctorAvailableForActiveAppointment(Staff doctor, String appointmentStatus)
```

- Si `status` ∉ {PROGRAMADA, REPROGRAMADA} → return.
- Si `doctor.staffType` ≠ MEDICO → `BusinessRuleException` (mensaje español).
- Si `!doctor.isActive()` → rechazar.
- Si `attendance` no es null/vacío y ≠ PRESENTE → rechazar.

**Mensaje sugerido (español, único):**

> El médico seleccionado no está disponible para agendar citas (personal inactivo o asistencia distinta de Presente). Actualice el registro en Personal o elija otro médico.

**Invocar** después de resolver el médico en `mapCommon` (o al inicio de `create` / `update` tras `mapCommon`), pasando el `status` de la petición.

**Sin cambios en:**

- DTOs de cita (`AppointmentCreateRequest` / `UpdateRequest`)
- `AppointmentResponse`
- `StaffResponse` (ya expone `attendance` y `active`)
- SQL / entidades

**Prueba backend (recomendada, mínima):**

- Test unitario o de servicio con médico mock: VACACIONES + status PROGRAMADA → `BusinessRuleException`.
- Opcional: PRESENTE + activo → no lanza.

### 2. Frontend — formulario de cita

**Archivo:** `appointment-page.utils.ts`

En `buildAppointmentDoctorOptions` (y función de agenda que filtra médicos, p. ej. línea ~347):

- Mantener: `staffType === 'MEDICO'`, `active === true`.
- Añadir: `attendance == null || attendance === '' || attendance === 'PRESENTE'`.

**Archivo:** `appointment-form-dialog.component.ts`

- En modo **editar**: al armar opciones, **incluir el médico actual de la cita** aunque no esté PRESENTE (parámetro opcional `includeStaffId?: number`), para que el autocomplete muestre etiqueta y el usuario pueda cambiarlo.

**Sin cambios de contrato API** ni nuevos campos en formulario.

### 3. Frontend — agenda (consistencia)

**Archivo:** `appointment-list-page.component.ts` (y utils si centraliza médicos de columnas)

- Mismo filtro de disponibilidad al construir columnas de médicos en vista día/semana.
- Citas **ya existentes** de un médico en vacaciones pueden seguir viéndose en agenda (histórico); no crear nuevas desde su columna si se oculta de la lista — decisión mínima: **ocultar médico no disponible de columnas vacías**, pero las citas ya cargadas del listado general siguen mostrándose al filtrar por médico en listado o al abrir detalle.

*(Si al ocultar columnas complica la demo, alternativa mínima: mostrar columna pero deshabilitar clic en hueco vacío — opcional; priorizar filtro en formulario + backend.)*

### 4. Documentación

| Archivo | Acción |
|---------|--------|
| `docs/fase_4_1_citas_consultas.md` | Párrafo “FA02 parcial vía 4.1b” con enlace a este doc |
| `docs/fase_4_1b_citas_fa02_disponibilidad_medico.md` | Este plan; actualizar a **Implementado** tras desarrollo |

## Estimación de esfuerzo

| Tarea | Orden | Esfuerzo |
|-------|-------|----------|
| Validación `AppointmentService` | 1 | Bajo |
| Filtro opciones médico + edición | 2 | Bajo |
| Ajuste agenda (filtro columnas) | 3 | Bajo |
| Test backend + `npm run build` + smoke manual | 4 | Bajo |

**Total:** una sesión corta; sin riesgo arquitectónico.

## Criterios de aceptación

1. Personal → médico en **VACACIONES** → **Nueva cita** no lista ese médico.
2. Intento forzado (si se prueba con API/REST client) → **400** con mensaje FA02.
3. **Calcular hora fin**, solapamiento, fechas futuras → sin regresión.
4. `mvn compile` / tests citas si existen → OK.
5. `npm run build` → OK.
6. Editar cita con médico en vacaciones obliga a cambiar médico o cancelar (no reprogramar activa con el mismo).

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Citas antiguas con médico hoy en vacaciones | Permitir ver/editar a estados finales; bloquear solo estados activos |
| `asistencia` null en datos viejos | Tratar como PRESENTE |
| FA02 del CU pide “ofrecer alternativos” | Mensaje invita a elegir otro médico; lista ya filtrada — suficiente para Opción A |
| Desfase UI vs API | Backend siempre valida |

## Relación con otras fases

| Fase | Relación |
|------|----------|
| **4.1** (hecha) | Solapamiento FA01; esta fase **complementa** FA02 |
| **3.2 / CU14** (parcial) | Provee `asistencia`; no sustituye turnos |
| **CU14 completo** (futura) | Horarios, bloqueos, RN05 agenda vs turno activo |

---

## Checklist de implementación

- [x] `validateDoctorAvailableForActiveAppointment` en `AppointmentService` (vía `mapCommon` → create y **update**)
- [x] Filtro `PRESENTE` en `buildAppointmentDoctorOptions` y `buildDoctorColumns`
- [x] `includeStaffId` en edición de cita (médico actual visible aunque en vacaciones; guardar activa sigue validando en backend)
- [x] Filtro médicos disponibles en `doctorFilterOptions` de agenda
- [ ] Test backend unitario (opcional; no existía suite previa)
- [ ] `npm run build` + smoke FA02 vacaciones (ejecutar tras despliegue local)

## Archivos modificados

| Ruta |
|------|
| `backend/.../appointment/service/AppointmentService.java` |
| `frontend/.../appointments/appointment-page.utils.ts` |
| `frontend/.../appointments/components/appointment-form-dialog.component.ts` |
| `frontend/.../appointments/pages/appointment-list-page/appointment-list-page.component.ts` |

---

*Plan Opción A — sin DDL, sin microservicios, alineado con `AGENTS.md`.*
