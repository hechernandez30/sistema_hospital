# Fase 3.2 — Usuarios (CU03), roles y personal básico (CU14 parcial)

## Qué se revisó

### CU03 — Usuarios

- `UserService`, `UserController`, `UserCreateRequest`, `UserUpdateRequest`, `UserResponse`: unicidad username (alta) y email (alta/cambio), estados `ACTIVO|BLOQUEADO|DESHABILITADO`, política de contraseña CU03 (`@Pattern` + validadores Angular `cu03PasswordValidator` / `optionalCu03PasswordValidator`), MFA como bandera sin implementación real.
- `SecurityConfig`: `/api/users/**` exclusivo de `ADMINISTRADOR`.
- Frontend: `user-list-page`, `user-form-dialog`, `user-detail-dialog`, `AuthService` + `ROLES_ADMIN_ONLY`.

### Roles

- `RoleService`, `RoleController`; seguridad `/api/roles/**` → `ADMINISTRADOR`.
- Frontend: `role-list-page` y mutación condicionada a admin.

### CU14 — Personal (básico)

- `StaffService`, `StaffController`, `StaffCreateRequest`, `StaffUpdateRequest`: código de empleado único, tipos permitidos, asistencia `PRESENTE|AUSENTE|PERMISO|VACACIONES`, horario texto, especialidad y usuario opcionales/vinculación con reglas (`BusinessRuleException` si usuario ya vinculado).
- `/api/staff/**` → `ADMINISTRADOR`, `RRHH`.
- Frontend: `staff-list-page`, `staff-form-dialog`, `staff-detail-dialog`, carga de usuarios solo admin para desplegable.

### Especialidades (relación con personal)

- `SpecialtyService`, mismo control de acceso que personal vía rutas RRHH/admin.

### Auditoría previa

- `UserService` ya registraba CREATE/UPDATE/DELETE con `BusinessAuditRecorder`; se revisó contenido del payload por sensibilidad.

## Qué se modificó

### Backend

1. **UserService**
   - Mensajes de negocio más explícitos para username/email duplicados (mismo HTTP 400, mismo campo `message`).
   - Auditoría (`summaryUserAudit`): se elimina el **correo** del payload de bitácora; se incluye `userId`, `username`, `roleId`, `state`. Sigue **`passwordRotated: true`** en UPDATE cuando se cambió contraseña (sin secreto).

2. **RoleService**
   - `BusinessAuditRecorder` en CREATE, UPDATE, DELETE.
   - Módulo `"roles"`, entidad `"Role"`, payload mínimo: `roleId`, `name`.

3. **StaffService**
   - `BusinessAuditRecorder` en CREATE, UPDATE, DELETE (módulo `"staff"`, entidad `"Staff"`).
   - Payload mínimo: `staffId`, `employeeCode`, `staffType`, `attendance`, `active`, `userId`, `specialtyId` cuando aplica.
   - Mensaje más claro para código de empleado duplicado.
   - UPDATE: snapshot anterior **antes** de mutar entidad (corrección de orden).
   - DELETE: carga de entidad antes de borrar para auditoría.

4. **SpecialtyService**
   - `BusinessAuditRecorder` en CREATE, UPDATE, DELETE (módulo `"specialties"`, entidad `"Specialty"`).
   - Payload mínimo: `specialtyId`, `name`, `durationMinutes`.

### Frontend

- **Usuarios:** lista con filtro **Estado** (Todos / ACTIVO / BLOQUEADO / DESHABILITADO) combinado con búsqueda de texto; hints en formulario alta (usuario único fijo tras crear, correo único).
- **Detalle usuario:** aclaración de MFA como bandera sin 2FA real; texto de que la contraseña no se expone.
- **Roles:** subtítulo de pantalla aclarando acceso solo administrador y que la matriz de permisos no cambió en la fase.
- **Personal:** columna **Asistencia** en tabla; criterio de búsqueda ampliado (asistencia, horario, colegiado, contratación, activo/inactivo); hints de código único en formulario.

## Qué no se modificó y por qué

- **Base de datos**, **endpoints**, **nombres de campos JSON**, **JWT** y **CU01**.
- Matriz RBAC central (`SecurityConfig` por URL): sin cambios; solo documentación/UX aclaratorio.
- **MFA funcional**, motor de turnos, detección de traslapes de horarios, integración Auditor/Operador multi-rol descriptivo más allá del modelo rol único.
- Citas, admisiones, triage, atenciones, pagos, farmacia, laboratorio, reportes (fuera de alcance).

## Estado final de CU03

- Alta/edición/eliminación y listado siguen exclusivos de administrador por API y UI (`ROLES_ADMIN_ONLY`).
- Username único en creación; correo único; contraseña nunca aparece en `UserResponse`; política CU03 vigente servidor + cliente.
- Estados acotados a ACTIVO, BLOQUEADO, DESHABILITADO.
- Unicidad y errores comunicados con mensajes más guiados en español.

## Estado parcial de CU14

- Personal: tipos del catálogo SQL, código empleado único, horario texto, asistencia del catálogo, vínculos usuario/especialidad con validaciones existentes.
- Lista permitie filtrar por contexto CU14 ampliando campos locales; vista tabular muestra asistencia.
- Sin motor de horarios ni validaciones avanzadas de solapamiento (pendientes para fases futuras).

## Archivos modificados

| Área | Archivos |
|------|-----------|
| Backend | `UserService.java`, `RoleService.java`, `StaffService.java`, `SpecialtyService.java` |
| Frontend | `user-list-page.component.ts/html/scss`, `user-form-dialog.component.html`, `user-detail-dialog.component.html/scss`, `role-list-page.component.html`, `staff-list-page.component.ts/html`, `staff-form-dialog.component.html` |
| Documentación | `docs/fase_3_2_usuarios_roles_personal.md` |

## Resultado pruebas backend

Ejecutado: `mvn clean compile test` desde `backend/` → **exit code 0**.

## Resultado build frontend

Ejecutado: `npm run build` desde `frontend/` → **exit code 0** (salida en `frontend/dist/hospital-web`).

## Smoke test manual (intranet — documentación)

| Caso | Esperado |
|------|-----------|
| Crear usuario válido | 201; listado/refresco OK. |
| Username duplicado | 400; mensaje claro en snackbar (`message`). |
| Email duplicado | 400 idem. |
| Contraseña débil | rechazo cliente y/o servidor según CU03. |
| Ver detalle usuario | sin campo contraseña; texto de MFA informativa. |
| Crear/editar personal | EMP + tipo + asistencia válida si se envía. |
| Código empleado duplicado | 400; mensaje de uso/en uso. |
| Asistencia inválida (si enviada mal) | 400 por `@Pattern`. |
| GET usuario / lista | ningún campo de contraseña en JSON. |

## Riesgos pendientes

- **Integraciones que parsen texto exacto** de errores antiguos de unicidad usuario/email/empleado: actualizar parsing si dependían del string viejo (estructura de error sin cambios).
- **Eliminación de email en auditoría de usuarios**: quien revisaba bitácora de negocio para correo debe usar otras fuentes (no se considera pérdida de contrato público).

## Recomendación para Fase 4

1. Definir hoja de ruta MFA real (o retirar bandera hasta estar listo).
2. Modelo de horario (turnos, plantillas, calendarios) cuando se autorice DDL y alcance funcional CU14 completo.
3. Consolidar filtros lado servidor opcionales (query params) si las tablas superan tamaño donde el filtro en cliente ya no basté.
4. Revisión explícita de matriz RBAC antes de crear roles nuevos o permisos compuestos (Auditor/Operador fuera si el modelo sigue rol único).
5. Pruebas de integración enfocadas en servicios usuario/rol/personal y bitácora de negocio (módulos `users`, `roles`, `staff`, `specialties`).
