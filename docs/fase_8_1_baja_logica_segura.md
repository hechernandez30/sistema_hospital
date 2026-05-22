# Fase 8.1 — Baja lógica segura en módulos con activo/estado existente

## Resumen ejecutivo

Se reemplazó el **borrado físico** por **baja lógica** en ocho módulos que ya disponen de campo `activo` o `estado` en el modelo de datos, **sin modificar el esquema SQL**, **sin cambiar rutas HTTP** ni la forma de los DTOs JSON. Los endpoints `DELETE` existentes se conservan; internamente actualizan el registro y registran auditoría como `UPDATE`.

Los listados de entidades maestras (`pacientes`, `personal`, `medicamentos`, `seguros`) ocultan inactivos por defecto y admiten el parámetro opcional de consulta `includeInactive=true` en el mismo `GET` de siempre.

---

## Módulos modificados

| Módulo | DELETE (mismo path) | Baja lógica | Auditoría |
|--------|---------------------|-------------|-----------|
| Usuarios | `DELETE /api/users/{id}` | `estado = DESHABILITADO` | UPDATE (state) |
| Pacientes | `DELETE /api/patients/{id}` | `activo = false` | UPDATE (active) |
| Personal | `DELETE /api/staff/{id}` | `activo = false` | UPDATE (active) |
| Seguros | `DELETE /api/patients/{patientId}/insurances/{insuranceId}` | `activo = false` | UPDATE (active) |
| Medicamentos | `DELETE /api/medications/{id}` | `activo = false` | UPDATE (active) |
| Citas | `DELETE /api/appointments/{id}` | `estado = CANCELADA` | UPDATE (status) |
| Pagos | `DELETE /api/payments/{id}` | `estado = ANULADO` | UPDATE (status) |
| Órdenes médicas | `DELETE /api/medical-orders/{id}` | `estado = ANULADO` | UPDATE (status) |

Operaciones idempotentes: si el registro ya está en estado terminal, `DELETE` termina sin error y sin duplicar auditoría innecesaria.

---

## Módulos fuera de alcance (sin cambios)

| Módulo | Motivo |
|--------|--------|
| Roles, especialidades | No tienen columna `activo` en el SQL actual |
| Admisiones, laboratorio, imágenes | Estados con significado clínico/operativo distinto a “baja” |
| Triage, atenciones médicas | Registros clínicos; requieren política explícita antes de baja lógica |

Siguen usando `repository.delete()` (borrado físico o rechazo por FK).

---

## Tabla antes / después por módulo

| Módulo | Antes (DELETE) | Después (DELETE) | Listado |
|--------|----------------|------------------|---------|
| Usuarios | Fila eliminada | `DESHABILITADO`; login bloqueado (`HospitalUserDetails`) | Todos visibles; filtro por estado en UI (ya existía) |
| Pacientes | Fila eliminada | `activo = false`; DPI/código conservados | Solo activos; `?includeInactive=true` |
| Personal | Fila eliminada | `activo = false` | Solo activos; `?includeInactive=true` |
| Seguros | Fila eliminada | `activo = false` | Solo activos por paciente; `?includeInactive=true` |
| Medicamentos | Fila eliminada | `activo = false`; stock conservado | Solo activos; `?includeInactive=true` |
| Citas | Fila eliminada | `estado = CANCELADA` | Sin filtro nuevo; historial visible |
| Pagos | Fila eliminada | `estado = ANULADO` | Sin filtro nuevo; historial visible |
| Órdenes médicas | Fila eliminada (+ posible CASCADE) | `estado = ANULADO`; lab/imagen no borrados | Sin filtro nuevo; historial visible |

---

## Archivos backend modificados

- `patient/repository/PatientRepository.java` — `findByActiveTrue()`
- `patient/service/PatientService.java`, `patient/controller/PatientController.java`
- `user/service/UserService.java`
- `staff/repository/StaffRepository.java`, `staff/service/StaffService.java`, `staff/controller/StaffController.java`
- `insurance/repository/InsuranceRepository.java`, `insurance/service/InsuranceService.java`, `insurance/controller/InsuranceController.java`
- `medication/repository/MedicationRepository.java`, `medication/service/MedicationService.java`, `medication/controller/MedicationController.java`
- `appointment/service/AppointmentService.java`
- `payment/service/PaymentService.java`
- `medicalorder/service/MedicalOrderService.java`
- `test/.../PatientControllerWebMvcTest.java` — mock `findAll(false)`

---

## Archivos frontend modificados

- `patients/services/patient-api.service.ts` — `includeInactive` en list/listInsurances
- `patients/pages/patient-list-page/*` — textos, checkbox “Incluir inactivos”
- `patients/components/patient-detail-dialog.*` — seguros: textos, checkbox
- `staff/services/staff-api.service.ts`, `staff/pages/staff-list-page/*`
- `medications/services/medication-api.service.ts`, `medications/pages/medication-list-page/*`
- `users/pages/user-list-page/*`
- `appointments/pages/appointment-list-page/*`
- `payments/pages/payment-list-page/*`
- `medical-orders/pages/medical-order-list-page/*`

Textos UI: títulos/confirmaciones/snacks y `matTooltip` alineados (Deshabilitar, Dar de baja, Desactivar, Cancelar, Anular). Los diálogos de confirmación muestran solo la pregunta y los datos del registro (sin mensaje técnico de retención en base de datos; ver [Ajustes UI posteriores](#ajustes-ui-posteriores-2026-05-21)).

---

## Decisión de listados y filtros

1. **Maestras con `activo`:** backend filtra por defecto; frontend expone “Incluir inactivos” (pacientes, personal, medicamentos, seguros en detalle).
2. **Usuarios:** no se ocultan en listado; filtro por `ACTIVO` / `BLOQUEADO` / `DESHABILITADO` en tabla (comportamiento previo mantenido).
3. **Transaccionales (citas, pagos, órdenes):** sin ocultar `CANCELADA` / `ANULADO`; siguen en listas para historial y reportes.

Parámetro opcional (misma ruta `GET`, no rompe clientes que no lo envían):

- `GET /api/patients?includeInactive=true`
- `GET /api/staff?includeInactive=true`
- `GET /api/medications?includeInactive=true`
- `GET /api/patients/{id}/insurances?includeInactive=true`

---

## Resultado de pruebas backend

```text
mvn clean compile test — OK (exit 0)
```

---

## Resultado de build frontend

```text
npm run build — OK (exit 0)
```

Advertencia previa de budget CSS en `public-layout.component.scss` (no bloqueante, fuera de alcance).

---

## Smoke test documentado (UAT manual recomendado)

| # | Acción | Resultado esperado |
|---|--------|-------------------|
| 1 | `DELETE` usuario activo | Fila permanece; `estado=DESHABILITADO`; no login |
| 2 | `DELETE` paciente activo | `activo=false`; fila fuera de lista por defecto; visible con “Incluir inactivos” |
| 3 | `DELETE` seguro activo | `activo=false`; póliza en BD |
| 4 | `DELETE` personal activo | `activo=false` |
| 5 | `DELETE` medicamento activo | `activo=false`; stock intacto |
| 6 | `DELETE` cita | `estado=CANCELADA`; visible en lista |
| 7 | `DELETE` pago | `estado=ANULADO` |
| 8 | `DELETE` orden médica | `estado=ANULADO`; registros lab/imagen no borrados |
| 9 | Bitácora tras cada operación | Evento `UPDATE` con estado/activo anterior y nuevo |
| 10 | UI intranet | Diálogos sin “Eliminar” / “no se puede deshacer” en módulos de alcance |

---

## Riesgos pendientes

- **DPI/código único:** paciente dado de baja sigue bloqueando el mismo DPI para un alta nueva.
- **Módulos fuera de fase:** roles, especialidades, admisiones, triage, atenciones, lab, imágenes siguen con delete físico.
- **Reportes/dashboard:** conteos pueden incluir inactivos/anulados según consultas actuales; revisar en fase de reportes si se requiere filtro global.
- **Seguros en pagos:** la sugerencia de cobertura ya considera `active`; alinear pruebas de pago con seguros desactivados.

---

## Recomendación para la siguiente fase (8.2)

1. Definir política para **roles/especialidades** (`activo` en SQL o mantener delete físico con FK).
2. Valorar **admisiones / lab / imágenes** con estados terminales acordados (evitar confundir `RECHAZADO` con “eliminado”).
3. **Triage y atenciones:** quitar botón eliminar o baja lógica con campo nuevo y gobierno clínico.
4. Pruebas de integración automatizadas por servicio para `delete()` lógico.
5. Actualizar `docs/casos_de_uso_*` donde indiquen “eliminación física”.

---

## Corrección post-UAT — Pacientes

### Síntoma reportado

Tras dar de baja un paciente desde la UI, la fila desaparecía de PostgreSQL (borrado físico), en contradicción con la Fase 8.1.

### Auditoría realizada

| Capa | Hallazgo |
|------|----------|
| Frontend | `PatientApiService.delete()` llama únicamente a `DELETE /api/patients/{id}`; sin segunda llamada ni otro endpoint. |
| `PatientController` | `DELETE /{id}` → `patientService.delete(id)` (correcto). |
| `PatientService` (fuente) | Ya no contenía `deleteById`/`delete`; usaba `setActive(false)` + `save`. |
| `target/classes` (bytecode) | `PatientService.delete` compilado con `setActive` + `save`, sin `deleteById`. |
| Entidad `Patient` | `@Column(name = "activo")` → campo Java `active` (mapeo correcto). |
| SQL | Tabla `hospital.pacientes`, columna `activo BOOLEAN`; sin trigger DELETE. |

### Causa raíz

1. **Código en repositorio ya era baja lógica** en la revisión de esta corrección; el borrado físico observado en UAT es **compatible con un backend en ejecución sin reiniciar** (JAR/clases anteriores a Fase 8.1) o con una instancia distinta a la recién compilada.
2. **Riesgo residual:** cualquier llamada futura a `repository.delete()` / `deleteById()` sobre `Patient` volvería a borrar físicamente (p. ej. código antiguo, refactor o uso directo del repositorio).

### Cambio aplicado (defensa en profundidad)

| Archivo | Cambio |
|---------|--------|
| `Patient.java` | `@PreRemove` lanza `BusinessRuleException` si Hibernate intenta `remove()` (bloquea DELETE físico). |
| `PatientRepository.java` | `deactivateById(Long id)` con `@Modifying` + `UPDATE Patient SET active = false` (no usa `remove`). |
| `PatientService.java` | `delete()` usa solo `deactivateById`; auditoría UPDATE con `active` antes/después; sin `save` tras mutación manual. |
| `PatientServiceSoftDeleteTest.java` | Verifica que nunca se invoca `delete`/`deleteById` en el repositorio. |
| `PatientControllerWebMvcTest.java` | Verifica `DELETE /api/patients/{id}` → `patientService.delete`. |

### Evidencia de prueba

**Antes (comportamiento incorrecto en UAT):** fila ausente en `hospital.pacientes` tras DELETE.

**Después (esperado con backend reiniciado y corrección desplegada):**

```sql
-- Tras DELETE /api/patients/{id} sobre paciente activo:
SELECT id_paciente, codigo_paciente, dpi_nit, activo FROM hospital.pacientes WHERE id_paciente = :id;
-- Debe devolver 1 fila con activo = false
```

- Listado `GET /api/patients` → no lista el paciente.
- `GET /api/patients?includeInactive=true` → sí lista el paciente con `active: false`.
- Seguros del paciente permanecen en `hospital.seguros`.

### Resultado de pruebas (corrección)

```text
mvn clean compile test — OK (incluye PatientServiceSoftDeleteTest y DELETE en PatientControllerWebMvcTest)
```

Frontend: sin cambios en esta corrección (`npm run build` no requerido).

### Confirmación

**`DELETE /api/patients/{id}` realiza baja lógica real** (`activo = false`), conserva la fila en PostgreSQL y bloquea borrado físico accidental vía `@PreRemove`.

**Acción operativa obligatoria:** reiniciar el proceso Spring Boot (`mvn spring-boot:run` o el servicio desplegado) después de `mvn clean package` para cargar las clases nuevas.

---

## Validación UAT manual

**Fecha de validación:** 2026-05-20 (cierre UAT, tras corrección de pacientes y reinicio del backend).

### Condiciones de prueba

- Se **reinició el backend** (`mvn spring-boot:run` / proceso Spring Boot recargado con clases de Fase 8.1) **antes** de ejecutar las pruebas manuales.
- Pruebas realizadas desde la **intranet** (botones de baja) y/o `DELETE` sobre los endpoints documentados.
- Verificación en **PostgreSQL** (`hospital.*`): existencia de fila y valor de `activo` / `estado` después de cada operación.

### Módulos probados (8/8)

| Módulo | Resultado UAT | Valor en BD tras baja |
|--------|---------------|------------------------|
| Usuarios | OK | `estado = DESHABILITADO` |
| Pacientes | OK | `activo = false` |
| Personal | OK | `activo = false` |
| Seguros | OK | `activo = false` |
| Medicamentos | OK | `activo = false` |
| Citas | OK | `estado = CANCELADA` |
| Pagos | OK | `estado = ANULADO` |
| Órdenes médicas | OK | `estado = ANULADO` |

### Confirmaciones de cierre

- **Ningún registro del alcance autorizado** fue eliminado físicamente de la base de datos; las filas permanecen para auditoría e historial.
- En todos los casos se actualizó el campo correspondiente (`activo` o `estado`) según la tabla de la fase.
- **Listados:**
  - **Maestras** (pacientes, personal, medicamentos, seguros): ocultan inactivos por defecto; con `includeInactive=true` (o equivalente en UI) reaparecen los dados de baja.
  - **Transaccionales** (citas, pagos, órdenes médicas): conservan historial visible en listado con estado terminal (`CANCELADA` / `ANULADO`).
- **Usuarios:** los registros con `estado = DESHABILITADO` **no pueden iniciar sesión** (validación coherente con `HospitalUserDetails`, solo `ACTIVO`).
- **Auditoría:** cambios registrados como actualización de estado/activo (no como borrado físico de fila).

### Estado de la fase

**Fase 8.1 — Baja lógica segura: CERRADA** (implementación + corrección pacientes + UAT manual aprobado).

Módulos **fuera de alcance** (roles, especialidades, admisiones, triage, atenciones médicas, laboratorio, imágenes) no forman parte de este cierre y siguen con política de eliminación documentada en fases posteriores.

---

## Ajustes UI posteriores (2026-05-21)

Sin cambiar rutas HTTP ni la semántica de baja lógica en backend.

### Diálogos de confirmación (todos los módulos con baja/anulación en intranet)

Se eliminó de los mensajes de `ConfirmDialog` la frase *“El registro permanecerá en el sistema para auditoría e historial.”* (y la constante `AUDIT_RETAIN` donde existía). El usuario ve únicamente la acción, el identificador y el contexto del registro.

| Área | Archivo(s) |
|------|------------|
| Pacientes | `patient-list-page`, `patient-detail-dialog` (seguros) |
| Usuarios, personal, medicamentos | `user-list-page`, `staff-list-page`, `medication-list-page` |
| Citas, pagos, órdenes médicas | `appointment-list-page`, `payment-list-page`, `medical-order-list-page` |
| Roles, especialidades | `role-list-page`, `specialty-list-page` |
| Admisiones, laboratorio, imágenes | `admission-list-page`, `laboratory-list-page`, `imaging-list-page` |

En admisiones, laboratorio e imágenes se conservan los avisos operativos propios del dominio (p. ej. *“No podrá usarse para nuevos flujos asistenciales”*, *“La orden médica no se elimina”*).

La retención de filas en PostgreSQL y la auditoría `UPDATE` siguen igual; solo se simplificó el texto visible.

### Pacientes — formulario y campo `activo`

Documentado en detalle en `docs/fase_3_1_pacientes_seguros.md` (sección *Campo activo y formulario*).

- **Alta:** sin checkbox; el POST envía siempre `active: true`.
- **Edición:** checkbox «Paciente activo» visible para reactivar un expediente dado de baja (además de la acción «Dar de baja» en lista, que usa `DELETE`).
- **Lista:** columna Estado (Activo/Inactivo); filtro «Incluir inactivos» preparado en código pero comentado en plantilla (el API admite `?includeInactive=true`).

---

*Fase 8.1 cerrada — implementación 2026-05-20 · Corrección pacientes 2026-05-20 · UAT manual aprobado 2026-05-20 · Ajustes UI 2026-05-21*
