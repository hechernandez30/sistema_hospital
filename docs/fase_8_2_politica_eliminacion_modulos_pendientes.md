# Fase 8.2 — Política de eliminación (módulos pendientes)

**Fecha implementación:** 2026-05-21  
**Estado:** Cerrada — UAT manual validado (2026-05-21)  
**Prerequisito:** Fase 8.1 validada (UAT manual)

---

## Resumen ejecutivo

Se completó la política de eliminación para los siete módulos pendientes de Fase 8.1:

| Módulo | Política aplicada |
|--------|-------------------|
| Roles | Baja lógica `activo = false` |
| Especialidades | Baja lógica `activo = false` |
| Admisiones | Anulación `estado = ANULADO` |
| Laboratorio | Anulación `estado = ANULADO` |
| Imágenes | Anulación `estado = ANULADO` |
| Triage | Sin baja lógica; botón eliminar quitado en UI |
| Atenciones médicas | Sin baja lógica; botón eliminar quitado en UI |

Los endpoints `DELETE` existentes se conservan; en backend dejan de borrar físicamente donde corresponde. La auditoría de negocio registra **UPDATE** con estado/activo anterior y nuevo (sin datos clínicos sensibles).

**Antes de levantar el backend** en un entorno con BD ya creada, ejecutar la migración:

`backend/scripts/migrate-fase-8-2-estados.sql`

---

## Decisiones por módulo

### 1. Roles

- **Decisión:** Baja lógica viable — columna `activo BOOLEAN DEFAULT TRUE`.
- **DELETE** → `activo = false` vía `RoleRepository.deactivateById`.
- **Listado:** `GET /api/roles?includeInactive=false` (default) oculta inactivos.
- **UI:** «Desactivar rol»; mensaje de auditoría e historial.
- **`@PreRemove`:** bloquea borrado físico JPA.

### 2. Especialidades

- Misma política que roles (`activo`, `includeInactive`, desactivar en UI).
- Formularios de citas/personal cargan solo especialidades activas (`list()` sin `includeInactive`).

### 3. Admisiones

- **Estado nuevo:** `ANULADO` (no se reutiliza `RECHAZADO`).
- **DELETE** → `estado = ANULADO`; fila permanece en BD.
- **Validaciones:** `AdmissionStatusRules` — admisiones `RECHAZADO` o `ANULADO` bloquean triage, atención médica nueva y pagos nuevos.
- **Auditoría:** `BusinessAuditActions.UPDATE` con `status` antes/después.

### 4. Laboratorio

- **Estado nuevo:** `ANULADO` (`RECHAZADO` = muestra rechazada/inválida).
- **DELETE** → anulación; orden médica **no** se elimina.
- **Auditoría:** UPDATE de estado.

### 5. Imágenes

- Igual que laboratorio; se añadió `BusinessAuditRecorder` en create/update/delete.
- **DELETE** → anulación; orden médica intacta.

### 6. Triage

- **Sin** baja lógica ni estados artificiales.
- Botón «Eliminar» **removido** del listado.
- Backend conserva `DELETE` (no expuesto en UI).
- Validación extendida: admisión `ANULADO` además de `RECHAZADO`.

### 7. Atenciones médicas

- **Sin** baja lógica.
- Botón «Eliminar» **removido** del listado.
- Validación: no crear atención sobre admisión `RECHAZADO`/`ANULADO`.

---

## Cambios de base de datos

| Tabla | Cambio |
|-------|--------|
| `roles` | `activo BOOLEAN NOT NULL DEFAULT TRUE` |
| `especialidades` | `activo BOOLEAN NOT NULL DEFAULT TRUE` |
| `admisiones` | CHECK `estado` incluye `ANULADO` |
| `laboratorio` | CHECK `estado` incluye `ANULADO` |
| `imagenes` | CHECK `estado` incluye `ANULADO` |

**Script base actualizado:** `hospital_postgresql_15_tablas_es.sql`  
**Migración BD existente:** `backend/scripts/migrate-fase-8-2-estados.sql`

No se eliminaron columnas ni se renombraron tablas.

---

## Cambios backend (resumen)

- Entidades JPA: `active` en Role/Specialty; `@PreRemove` en Role, Specialty, Admission, Laboratory, ImagingStudy.
- Servicios: soft delete / anulación; sin `repository.delete` / `deleteById` en módulos tratados.
- `AdmissionStatusRules` compartido para validaciones asistenciales.
- DTOs: patrones de estado ampliados con `ANULADO`; `RoleResponse` / `SpecialtyResponse` exponen `active`.
- Controllers roles/especialidades: query `includeInactive`.

---

## Cambios frontend (resumen)

- Roles / especialidades: checkbox «Incluir inactivos», columna Activo, textos Desactivar.
- Admisiones / laboratorio / imágenes: textos Anular, constantes y etiquetas `ANULADO`, botón deshabilitado si ya anulado.
- Triage / atenciones médicas: sin botón eliminar.
- Modelos API: `active` en roles/especialidades; `list(includeInactive?)` en servicios.

---

## Tabla antes / después

| Módulo | Antes (DELETE) | Después | UI |
|--------|----------------|---------|-----|
| Roles | DELETE físico | `activo=false` | Desactivar |
| Especialidades | DELETE físico | `activo=false` | Desactivar |
| Admisiones | DELETE físico | `estado=ANULADO` | Anular |
| Laboratorio | DELETE físico | `estado=ANULADO` | Anular solicitud |
| Imágenes | DELETE físico | `estado=ANULADO` | Anular estudio |
| Triage | DELETE físico (UI visible) | Sin cambio backend | Sin botón eliminar |
| Atenciones | DELETE físico (UI visible) | Sin cambio backend | Sin botón eliminar |

**Delete físico mantenido:** solo en triage y atenciones vía API directa (fuera de UI), documentado como pendiente de política clínica explícita.

---

## Pruebas automatizadas

| Comando | Resultado |
|---------|-----------|
| `mvn clean compile test` | **OK** (exit 0) |
| `npm run build` | **OK** (exit 0; warning presupuesto SCSS portal público, preexistente) |

---

## Smoke test (manual — checklist UAT)

Checklist ejecutado en UAT (ver sección **Validación UAT manual** al final del documento).

### Roles
- [x] Desactivar rol → fila en BD, `activo=false`
- [x] No aparece en listado por defecto
- [x] Con «Incluir inactivos» sí aparece
- [x] Auditoría UPDATE con `active` antes/después

### Especialidades
- [x] Desactivar especialidad → `activo=false`, fila persiste
- [x] No en selector de formulario nuevo (citas/personal)
- [x] Incluir inactivas en listado administrativo

### Admisiones
- [x] Anular → `estado=ANULADO`, fila persiste
- [x] No permite nuevo triage / atención / pago sobre esa admisión
- [x] Auditoría UPDATE

### Laboratorio
- [x] Anular → `estado=ANULADO`; orden médica sigue en BD
- [x] Auditoría UPDATE

### Imágenes
- [x] Anular → `estado=ANULADO`; orden médica intacta
- [x] Auditoría UPDATE

### Triage
- [x] Sin botón eliminar en listado
- [x] Crear / editar / ver sigue operativo

### Atenciones médicas
- [x] Sin botón eliminar en listado
- [x] Crear / editar / ver sigue operativo

---

## Riesgos pendientes

1. **Migración obligatoria** en BD de desarrollo/producción antes de arrancar JPA con `validate` — sin columnas/constraints nuevos el arranque fallará.
2. **Roles inactivos** ya asignados a usuarios existentes: el usuario sigue teniendo el rol en BD; solo se oculta en listados de selección nuevos.
3. **Triage / atenciones:** `DELETE` API sigue disponible; requiere Fase futura (política clínica, permisos, posible anulación certificada).
4. **Órdenes médicas** sobre admisión anulada: no se añadió bloqueo adicional en esta fase (solo flujos explícitos triage/atención/pago).

---

## Recomendación — siguiente fase

- **Fase 8.3:** Política formal para registros clínicos (triage, atención): anulación con motivo, rol autorizado, bitácora reforzada; deshabilitar `DELETE` en API o restringir por rol.
- **Fase 8.4:** Pruebas E2E automatizadas (Cypress/Playwright) para desactivar/anular y validar bloqueos de negocio.

---

## Archivos principales tocados

**SQL:** `hospital_postgresql_15_tablas_es.sql`, `backend/scripts/migrate-fase-8-2-estados.sql`

**Backend:** `AdmissionStatusRules.java`, entidades/repositorios/servicios/DTOs de role, specialty, admission, laboratory, imaging; `TriageService`, `MedicalCareService`, `PaymentService`; test `RoleControllerWebMvcTest`

**Frontend:** modelos y listados de roles, specialties, admissions, laboratory, imaging, triage, medical-cares; `admission-chip-class.ts`, `admission-ui.styles.scss`

---

## Validación UAT manual

| Campo | Valor |
|-------|--------|
| **Fecha de validación** | 2026-05-21 |
| **Responsable** | UAT manual (equipo proyecto) |
| **Entorno** | Desarrollo local (backend + frontend + PostgreSQL) |

### Precondiciones verificadas

- **Backend reiniciado** tras aplicar la migración `backend/scripts/migrate-fase-8-2-estados.sql` y antes de las pruebas funcionales. **Confirmado.**
- **Módulos de la fase probados:** roles, especialidades, admisiones, laboratorio, imágenes, triage y atenciones médicas. **Confirmado.**

### Resultados por criterio

| Criterio | Resultado UAT |
|----------|----------------|
| Roles y especialidades según decisión implementada (`activo = false`, listados con `includeInactive`, UI «Desactivar») | **OK** |
| Admisiones: no borrado físico; registro permanece con `estado = ANULADO` | **OK** |
| Laboratorio: no borrado físico; registro permanece con `estado = ANULADO` | **OK** |
| Imágenes: no borrado físico; registro permanece con `estado = ANULADO` | **OK** |
| `RECHAZADO` **no** se usa como baja lógica (conserva significado operativo propio) | **OK** |
| Triage: sin botón «Eliminar» en UI; crear / editar / ver operativos | **OK** |
| Atenciones médicas: sin botón «Eliminar» en UI; crear / editar / ver operativos | **OK** |
| Sin eliminación física en BD para módulos corregidos de Fase 8.2 (verificación en base de datos) | **OK** |
| Módulos clínicos protegidos (triage, atenciones) no exponen eliminación desde frontend | **OK** |
| Textos UI correctos: **Desactivar** (roles, especialidades) y **Anular** (admisiones, laboratorio, imágenes) | **OK** |
| Estabilidad del proyecto (`mvn clean compile test`, `npm run build` previos a UAT; sin regresiones observadas en prueba manual) | **OK** |

### Conclusión UAT

La Fase 8.2 queda **cerrada** desde el punto de vista funcional y documental. La política de eliminación acordada se cumple en los siete módulos del alcance; los registros transaccionales anulados o desactivados permanecen en base de datos para auditoría e historial.
