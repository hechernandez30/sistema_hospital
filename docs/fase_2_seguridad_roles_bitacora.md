# Fase 2 — Seguridad, roles y bitácora

**Fecha:** 5 de mayo de 2026  
**Objetivo:** Revisión controlada de seguridad y RBAC, confirmación de CU01, inventario de inconsistencias backend/frontend y **auditoría de negocio de bajo riesgo** usando la tabla `bitacora` existente, sin DDL ni cambios de contratos HTTP.

---

## Resumen de cambios

1. **Seguridad JWT / Spring Security / Angular:** sin cambios de comportamiento (filtro, entry point, handler, matcher, JWT, login). Revisión documentada en este entregable.
2. **CU01:** Portal público solo rutas informativas bajo `public.routes.ts` y login en `/p/acceso`; sin llamadas de mutación públicas a `/api/**` desde esas pantallas.
3. **Roles:** comparación `SecurityConfig` ↔ `role-routes.ts` + rutas intranet; inconsistencias menores anotadas sin modificar matriz de roles.
4. **Bitácora:** nuevo componente **`BusinessAuditRecorder`** que invoca `AuditLogService.recordEvent` de forma **segura** (errores registrados con `WARN`, no revierten la operación de negocio). Registro de **CREATE / UPDATE / DELETE** en admisiones, pagos, medicamentos y usuarios.

---

## Roles revisados (backend `SecurityConfig`)

| Prefijo API | Roles permitidos |
|-------------|------------------|
| `/api/users/**`, `/api/roles/**` | ADMINISTRADOR |
| `/api/audit-logs/**` | ADMINISTRADOR, AUDITOR |
| `/api/payments/**` | ADMINISTRADOR, CAJERO |
| `/api/medications/**` | ADMINISTRADOR, FARMACIA |
| `/api/laboratory/**` | ADMINISTRADOR, LABORATORIO, MEDICO |
| `/api/imaging/**` | ADMINISTRADOR, MEDICO |
| `/api/medical-orders/**` | ADMINISTRADOR, MEDICO, FARMACIA |
| `/api/medical-cares/**` | ADMINISTRADOR, MEDICO |
| `/api/appointments/**` | ADMINISTRADOR, MEDICO, RECEPCIONISTA |
| `/api/admissions/**`, `/api/triage/**` | ADMINISTRADOR, RECEPCIONISTA |
| `/api/staff/**` | ADMINISTRADOR, RRHH |
| `/api/specialties/**` | ADMINISTRADOR, RRHH |
| `GET /api/patients/**` | ADMINISTRADOR, MEDICO, RECEPCIONISTA, CAJERO |
| `POST/PUT/DELETE /api/patients/**` | ADMINISTRADOR, MEDICO, RECEPCIONISTA |
| Resto `/api/**` | ADMINISTRADOR |

**Rutas públicas JWT** centralizadas en `HospitalPublicEndpointMatcher`: OPTIONS `/**`, `/error`, `GET /actuator/health`, `POST /api/auth/login`, y en perfil `dev` Swagger/OpenAPI.

---

## Inconsistencias o matices backend / frontend

| Tema | Observación | Acción en Fase 2 |
|------|-------------|------------------|
| Cobertura espacial rutas SPA vs API | Angular protege vistas con `roleGuard` + JWT en cliente; el **control efectivo** es el backend. Roles en `intranet.routes.ts` coinciden con los prefijos anteriores donde existen vistas. | Solo documentación (sin mover roles). |
| CAJERO y pacientes | Backend: solo **GET** en `/api/patients/**`; mutaciones bloqueadas. Frontend: `ROLES_PATIENTS` lista CAJERO para la lista pero operaciones típicas de diálogo dependen de permisos de API; la matriz del backend es la fuente de verdad. | Documentado. |
| Acceso denegado UX | `roleGuard` redirige a `/app/panel` si el rol no coincide; el backend responde **403** con `ApiErrorResponse` si se llama la API directamente. | Comportamiento distinto HTTP vs SPA; no cambiado. |
| AUDITOR | Solo bitácora en API; sin acceso al resto de módulos salvo lo que el token permita (no expuesto en menú para otros módulos si no hay ruta). | Verificar menú en Fase futura si se desea UX explícita. |

**No se detectó contradicción grave** entre `role-routes.ts` y las reglas principales de `SecurityConfig` para los módulos con pantalla en la intranet.

---

## CU01 — Portal público

- Rutas bajo `frontend/src/app/public/public.routes.ts`: inicio, nosotros, servicios, especialidades (informativo), contacto, **acceso** (login personal).
- **No** hay registro público, reserva de cita ni POST/PUT/DELETE a `/api` desde el módulo público en el código enrutado.
- Mutaciones siguen requiriendo JWT (o perfil dev con seguridad abierta).

---

## Eventos de auditoría existentes

| Origen | Módulo en bitácora | Acciones |
|--------|-------------------|----------|
| `SecurityAuditService` → `AuditLogService` | `security` | `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `ACCESS_DENIED`, `JWT_INVALID` |
| `AuthController` (tras login OK) | vía `SecurityAuditService` | `LOGIN_SUCCESS` |

**Entidad registro:** `SecurityEvent` (metadatos en `newData` / detalles).

---

## Eventos de auditoría agregados (negocio)

Módulos y acciones (`BusinessAuditActions`: `CREATE`, `UPDATE`, `DELETE`):

| Módulo (`module`) | `entityType` | Operaciones | Resumen en JSON |
|-------------------|--------------|-------------|-----------------|
| `admissions` | `Admission` | crear, actualizar, eliminar | `patientId`, `status` (y anterior en UPDATE/DELETE) |
| `payments` | `Payment` | crear, actualizar, eliminar | `patientId`, `status`, `totalToPay` (cadena decimal) |
| `medications` | `Medication` | crear, actualizar, eliminar | `name`, `currentStock`, `active` |
| `users` | `User` | crear, actualizar, eliminar | `username`, `email`, `roleId`, `state`; en UPDATE con cambio de contraseña **`passwordRotated: true`** (sin almacenar secreto) |

El **usuario auditor** (`id_usuario` en bitácora) se obtiene del **JWT actual** (`JwtAuthenticationDetails`). La IP cliente usa `RequestContextHolder` cuando está disponible (misma idea que seguridad).

**Operaciones aún sin auditoría de negocio** (solo inventario para fases siguientes): pacientes, roles, especialidades/personal, citas, triage, atenciones, órdenes, laboratorio, imágenes, seguros anidados, etc.

---

## Archivos modificados (esta fase — código nuevo o integración)

| Archivo |
|---------|
| `backend/src/main/java/com/hospital/auditlog/BusinessAuditActions.java` |
| `backend/src/main/java/com/hospital/auditlog/BusinessAuditRecorder.java` |
| `backend/src/main/java/com/hospital/admission/service/AdmissionService.java` |
| `backend/src/main/java/com/hospital/payment/service/PaymentService.java` |
| `backend/src/main/java/com/hospital/medication/service/MedicationService.java` |
| `backend/src/main/java/com/hospital/user/service/UserService.java` |
| `docs/fase_2_seguridad_roles_bitacora.md` |

**No modificados:** `JwtAuthenticationFilter`, `RestAuthenticationEntryPoint`, `RestAccessDeniedHandler`, `HospitalPublicEndpointMatcher`, `SecurityConfig`, `AuthController`, guards Angular (revisión solo).

---

## Confirmaciones

- **Base de datos:** sin nuevas tablas, columnas ni migraciones; se usa `hospital.bitacora` existente.
- **Contratos de API:** mismos endpoints, métodos y nombres de campos JSON; las respuestas de negocio no cambian; solo pueden aparecer registros extra en bitácora al persistir cambios auditados.
- **JWT / login / MFA:** sin cambios.
- **Roles de negocio:** sin alteración en `SecurityConfig` ni constantes Angular.

---

## Resultado pruebas backend

- Comando: `mvn -q clean compile test` (`backend/`).
- **Exit code:** `0`.

---

## Resultado build frontend

- Comando: `npm run build` (`frontend/`).
- **Exit code:** `0` *(sin cambios de código aplicados específicamente para Fase 2 en esta ejecución; build verificado para conformidad).

---

## Comprobaciones de rutas (revisión estática)

- **Públicas:** `HospitalPublicEndpointMatcher` + primera regla `permitAll` en `SecurityConfig` alineadas con documentación (`POST /api/auth/login`, salud, CORS OPTIONS, `/error`; Swagger solo en `dev`).
- **Protegidas:** `/api/**` exige autenticación con rol adecuado salvo matchers anteriores; Angular intranet usa `authGuard` + `roleGuard` para coherencia de navegación.

---

## Riesgos pendientes

- **Concurrencia / transacciones:** la auditoría de negocio se escribe **en la misma transacción** que la operación; si hubiera fallo de persistencia después del registro pero antes del commit, comportamiento habitual de rollback aplica conjuntamente (igual que otras escrituras).
- **`userId` en bitácora:** si el JWT tuviera un `uid` inválido frente a BD, `AuditLogService` podría lanzar; `BusinessAuditRecorder` lo captura y deja **trazabilidad incompleta** con aviso en log.
- **Hilos sin request:** IP nula si no hay `RequestContextHolder` (p. ej. tareas asíncronas); no afecta CRUD síncronos actuales de controladores.

---

## Recomendación para la siguiente fase

1. Extender `BusinessAuditRecorder` a **pacientes** y **pagos/seguros** solo si hay acuerdo de datos personales en `datos_nuevos`.
2. Unificar UX de **403** en Angular (mensaje vs redirección a panel).
3. **MFA** y endurecimiento de sesión fuera de esta fase.
4. Pruebas de integración que verifiquen filas en `bitacora` tras mutaciones (perfil `test` con BD o Testcontainers, si se adopta).

---

*Entregable Fase 2 completado.*
