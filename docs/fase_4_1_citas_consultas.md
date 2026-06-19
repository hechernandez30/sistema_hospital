# Fase 4.1 — Consultas / Citas médicas (CU04)

## Qué se revisó

### Backend

- `AppointmentCreateRequest`, `AppointmentUpdateRequest`: validación `@Future` en `startAt`/`endAt`, Jakarta en motivo, estado obligatorio.
- `AppointmentService`: estados permitidos; `ACTIVE_STATUS` = PROGRAMADA, REPROGRAMADA; validación paciente/médico/especialidad/usuario; antes existía colisión solo por **misma fecha/hora de inicio** vía `existsByDoctor_IdAndStartAtAndStatusIn`.
- `AppointmentController`: sin cambios de rutas.
- `AppointmentRepository`: método legacy de colisión por solo `startAt`.
- `Appointment` entidad: tabla `hospital.citas` (sin cambios).

### Frontend

- Lista: enriquecimiento con paciente/medico/especialidad cuando el rol puede listar catálogos; filtro texto; columna estado en texto plano.
- Formulario: IDs paciente/médico/especialidad opcional; validador de rango inicio/fin; `APPOINTMENT_STATUSES`.
- Detalle: muestra estado texto.

## Qué se modificó

### Backend

1. **Solapamiento por intervalo (mismo médico, citas activas)**  
   - Nuevo `countActiveOverlapInterval` (JPQL): traslape cuando `nuevoInicio < existingEnd` y `existingStart < nuevoFin` (instantes contiguos **no** cuentan como traslape).  
   - Excluye la cita actual en UPDATE (`excludeId`).  
   - Solo aplica si el estado de la cita es PROGRAMADA o REPROGRAMADA.  
   - Mensaje de negocio unificado y legible para conflicto de agenda.

2. **Mensaje si fin ≤ inicio**  
   - Texto explícito indicando que **no pueden ser iguales**.

3. **Auditoría de negocio** (`BusinessAuditRecorder`)  
   - Módulo `"appointments"`, entidad `"Appointment"`.  
   - CREATE / UPDATE / DELETE con payload mínimo: `appointmentId`, `patientId`, `doctorId`, `startAt`, `endAt`, `status` (ISO-8601 como string).  
   - Sin motivo ni otros datos clínicos.

4. **DELETE**  
   - Carga entidad antes de borrar para registrar auditoría.

### Frontend

1. **Lista y detalle**: chips de color por estado (**PROGRAMADA**, **REPROGRAMADA**, **CANCELADA**, **ATENDIDA**, **NO_ASISTIO**), clases compartidas (`appointment-status.styles.scss` + `appointment-status-chip.ts`).

2. **Formulario**  
   - Mensajes de ayuda (estados, no traslapes en activas).  
   - Validación explícita antes de enviar: **fin estrictamente mayor que inicio**.  
   - **Duración de especialidad**: solo para roles con acceso a GET `/api/specialties` (ADMINISTRADOR, RRHH)—`mat-select` del catálogo y botón **Calcular hora fin (duración de especialidad)**; no cambia contrato (mismos campos `specialtyId`, `startAt`, `endAt`). Recepción/médico siguen usando **ID manual** de especialidad sin listar catálogo (alineado con seguridad actual).  
   - Opciones de estado con chips en el desplegable.

3. **Utilidades** (`datetime-local.ts`): `dateToDatetimeLocal`, `addMinutesToDatetimeLocal`.

## Qué no se modificó y por qué

- **Base de datos**: sin DDL ni migraciones.
- **Contratos REST** y **nombres de campos**.
- **JWT** y **roles** en `SecurityConfig` (solo aclaración UX en formulario).
- **Estados** del dominio: mismos valores.
- **`@Future` en DTOs**: se mantiene como estaba; permite coherencia “cita futura” en creación/edición. Para **reprogramaciones en el pasado** o cierres retroactivos puede chocar con validación Bean Validation; mitigación futura (p. ej. quitar solo en UPDATE o usar grupos) — **no tocado** en esta fase según restricción explícita del usuario.
- **Notificaciones reales**: checkboxes sin cambio.
- **Salas / otros módulos** (admisiones, triage, pagos, etc.).

## Extensión 4.1b — FA02 médico no disponible

Ver `docs/fase_4_1b_citas_fa02_disponibilidad_medico.md`. Valida en **alta y edición** que el médico esté activo y con asistencia **PRESENTE** cuando la cita queda PROGRAMADA/REPROGRAMADA (vacaciones/ausente/permiso rechazan guardado).

## Estado final de CU04

- Validación de disponibilidad por **intervalo** entre citas **PROGRAMADA/REPROGRAMADA** del mismo médico.  
- Otro médico puede tener cita en horario superpuesto al primero.  
- Estados visibles y coherentes con backend.  
- Auditoría de alta/baja/cambio sin datos clínicos sensibles.  
- Sugerencia opcional de duración vía catálogo solo cuando el rol permite leer especialidades.

## Archivos modificados o nuevos

| Ruta |
|------|
| `backend/.../appointment/repository/AppointmentRepository.java` |
| `backend/.../appointment/service/AppointmentService.java` |
| `frontend/.../appointments/appointment-status.styles.scss` *(nuevo)* |
| `frontend/.../appointments/appointment-status-chip.ts` *(nuevo)* |
| `frontend/.../appointments/components/appointment-form-dialog.component.ts/html/scss` |
| `frontend/.../appointments/pages/appointment-list-page/...ts/html/scss` |
| `frontend/.../appointments/components/appointment-detail-dialog.component.ts/html/scss` |
| `frontend/.../features/shared/datetime-local.ts` |
| `docs/fase_4_1_citas_consultas.md` |

## Resultado pruebas backend

`mvn clean compile test` ejecutado desde `backend/` → **exit code 0**.

## Resultado build frontend

`npm run build` desde `frontend/` → **exit code 0**.

## Smoke test manual (documentado)

| Caso | Esperado |
|------|-----------|
| Cita válida futura | 201 / 200; aparece en lista. |
| Fin ≤ inicio | 400 (backend) + formulario cliente bloqueante. |
| Traslape mismo médico, ambas PROGRAMADA/REPROGRAMADA | 400 con mensaje de solapamiento. |
| Dos médicos mismo horario | Permitido si no hay otro vínculo de reglas. |
| Cambiar estado a CANCELADA con solape | No debe bloquear por agenda (solo activas cuentan). |
| Eliminar / editar cita | Flujo habitual; auditoría registrada si bitácora operativa. |
| Roles recepción/médico con especialidad | Entrada manual de ID especialidad sigue igual. |

## Riesgos pendientes

1. **`@Future` en PUT**: editar una cita existente pasada (p. ej. corrección administrativa) puede ser rechazada por validación; analizar en fase dedicada con grupos o reglas por estado.  
2. **Consumidores que dependían del mensaje exacto** del error de colisión por solo hora de inicio.  
3. **Zona horaria**: `datetime-local` es local del navegador; consistencia con servidor asumida como en el resto del sistema.

## Recomendación para Fase 4.2

1. Revisar si CU04 necesita **grupos de validación** (create vs update) para relajar `@Future` solo en actualización o estados finales.  
2. Integración ligera con **recordatorios** (sin envío real hasta canal acordado).  
3. Listado de citas con **filtro por estado** y por rango de fechas (solo cliente o query params si se autoriza contrato).  
4. Pruebas de integración JPA para `countActiveOverlapInterval` (datos de prueba con varios solapes).  
5. Si el hospital desea **obligar** especialidad médica en cita, validar `staffType` del doctor en servicio (regla de negocio adicional).
