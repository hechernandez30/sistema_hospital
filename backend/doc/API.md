# API REST — Sistema hospitalario (backend)

Base URL por defecto: `http://localhost:8080`  
Todas las rutas bajo el prefijo documentado devuelven JSON salvo `204 No Content` en borrados.

## Seguridad (S2 JWT + S3 endurecimiento)

- Con `app.security.enabled=true` (por defecto), toda petición bajo `/api/**` **excepto** las rutas públicas listadas abajo exige cabecera **`Authorization: Bearer <accessToken>`** con JWT válido (modo **stateless** en todo momento, incluido dev/test abierto).
- Login: `POST /api/auth/login` con `{"username":"...","password":"..."}` → respuesta JSON con `userId`, `username`, `roles` y **`accessToken`** (JWT).
- Configuración JWT: `app.jwt.secret` (UTF-8, mínimo 32 bytes para HS256) y `app.jwt.expiration-minutes` en `application.yml` (sustituir secreto en producción).
- Con perfil `dev` y `application-dev.yml`, `app.security.enabled=false` deja la API abierta para desarrollo local (sin Bearer).
- Swagger solo en perfil `dev` (`springdoc.*.enabled=true`); en OpenAPI use **Authorize** con el valor `Bearer <accessToken>` del login.
- **401 y 403** (filtro de seguridad y login fallido vía `GlobalExceptionHandler`) usan el mismo formato **`ApiErrorResponse`** que el resto de la API (`timestamp`, `status`, `error`, `message`, `path`, `fieldErrors`). Para JWT inválido o expirado el cuerpo suele incluir `message`: **`Token inválido o expirado`**. Sin token o no autenticado: **`No autorizado`**. **403** (`RestAccessDeniedHandler`): **`Acceso denegado`**.
- **Auditoría de seguridad** (solo interna, sin POST de bitácora): eventos `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `ACCESS_DENIED`, `JWT_INVALID` en módulo `security` vía `SecurityAuditService` → `AuditLogService.recordEvent`.

### Rutas públicas (`app.security.enabled=true`)

Definidas de forma centralizada en `HospitalPublicEndpointMatcher` (misma fuente que el filtro JWT).

| Método | Ruta | Descripción |
|--------|------|-------------|
| OPTIONS | `/**` | Preflight CORS |
| * | `/error` | Error dispatcher Spring |
| GET | `/actuator/health` | Salud |
| POST | `/api/auth/login` | Login (emite JWT) |
| (solo perfil `dev`) | `/swagger-ui/**`, `/v3/api-docs/**`, `/swagger-ui.html` | OpenAPI |

### Autorización por rol (prefijos en `SecurityConfig`)

Los roles en token coinciden con BD (`ROLE_<NOMBRE>`). Resumen:

| Rol | Acceso principal |
|-----|------------------|
| **ADMINISTRADOR** | Todo `/api/**` no cubierto por reglas más específicas (acceso total efectivo). |
| **AUDITOR** | Solo `/api/audit-logs/**` (la API solo expone GET en bitácora). |
| **MEDICO** | `/api/patients/**`, `/api/appointments/**`, `/api/medical-cares/**` (propias vía filtro servicio), `/api/medical-orders/**`, `/api/laboratory/**`, `/api/imaging/**`; **GET** `/api/medications/**`, `/api/staff/**`, `/api/specialties/**` |
| **MEDICO-JEFE** | Igual que MEDICO pero **`/api/medical-cares/**` sin filtro** (todas las atenciones); rol operativo para reasignación |
| **RECEPCIONISTA** | `/api/patients/**`, `/api/appointments/**`, `/api/admissions/**`, `/api/triage/**`; **GET** `/api/staff/**`, `/api/specialties/**` (pickers citas/admisiones) |
| **CAJERO** | `/api/payments/**` y **solo GET** sobre `/api/patients/**` (incl. seguros anidados bajo paciente). |
| **FARMACIA** | `/api/medications/**`, `/api/medical-orders/**` |
| **LABORATORIO** | `/api/laboratory/**` |
| **RRHH** | `/api/staff/**`, `/api/specialties/**` |

Reglas adicionales: **`/api/users/**` y `/api/roles/**`** solo **ADMINISTRADOR**. **`/api/audit-logs/**`** solo **ADMINISTRADOR** y **AUDITOR**.

---

## Roles

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/roles` | Listar |
| GET | `/api/roles/{id}` | Obtener |
| POST | `/api/roles` | Crear |
| PUT | `/api/roles/{id}` | Actualizar |
| DELETE | `/api/roles/{id}` | Eliminar |

## Usuarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/users` | Listar |
| GET | `/api/users/{id}` | Obtener |
| POST | `/api/users` | Crear |
| PUT | `/api/users/{id}` | Actualizar |
| DELETE | `/api/users/{id}` | Eliminar |

**Contraseña (CU03 — Fase 1.3):** en alta la contraseña es obligatoria; longitud **8–255** y debe incluir al menos **una minúscula**, **una mayúscula** y **un dígito**. En actualización, el campo `password` puede omitirse o ir vacío; si se envía valor, debe cumplir la misma regla.

## Especialidades

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/specialties` | Listar |
| GET | `/api/specialties/{id}` | Obtener |
| POST | `/api/specialties` | Crear |
| PUT | `/api/specialties/{id}` | Actualizar |
| DELETE | `/api/specialties/{id}` | Eliminar |

## Personal (staff)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/staff` | Listar |
| GET | `/api/staff/{id}` | Obtener |
| POST | `/api/staff` | Crear |
| PUT | `/api/staff/{id}` | Actualizar |
| DELETE | `/api/staff/{id}` | Eliminar |

## Pacientes

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/patients` | Listar |
| GET | `/api/patients/{id}` | Obtener |
| POST | `/api/patients` | Crear |
| PUT | `/api/patients/{id}` | Actualizar |
| DELETE | `/api/patients/{id}` | Eliminar |

## Seguros (por paciente)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/patients/{patientId}/insurances` | Listar |
| GET | `/api/patients/{patientId}/insurances/{insuranceId}` | Obtener |
| POST | `/api/patients/{patientId}/insurances` | Crear |
| PUT | `/api/patients/{patientId}/insurances/{insuranceId}` | Actualizar |
| DELETE | `/api/patients/{patientId}/insurances/{insuranceId}` | Eliminar |

## Medicamentos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/medications` | Listar |
| GET | `/api/medications/{id}` | Obtener |
| POST | `/api/medications` | Crear |
| PUT | `/api/medications/{id}` | Actualizar |
| DELETE | `/api/medications/{id}` | Eliminar |

## Citas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/appointments` | Listar |
| GET | `/api/appointments/{id}` | Obtener |
| POST | `/api/appointments` | Crear |
| PUT | `/api/appointments/{id}` | Actualizar |
| DELETE | `/api/appointments/{id}` | Eliminar |

## Admisiones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admissions` | Listar |
| GET | `/api/admissions/{id}` | Obtener |
| POST | `/api/admissions` | Crear |
| PUT | `/api/admissions/{id}` | Actualizar |
| DELETE | `/api/admissions/{id}` | Eliminar |

## Triage

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/triage` | Listar (opcional `?admissionId=`) |
| GET | `/api/triage/{id}` | Obtener |
| POST | `/api/triage` | Crear |
| PUT | `/api/triage/{id}` | Actualizar |
| DELETE | `/api/triage/{id}` | Eliminar |

## Atenciones médicas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/medical-cares` | Listar (opcional `?patientId=`) |
| GET | `/api/medical-cares/{id}` | Obtener |
| POST | `/api/medical-cares` | Crear |
| PUT | `/api/medical-cares/{id}` | Actualizar |
| DELETE | `/api/medical-cares/{id}` | Eliminar |

## Órdenes médicas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/medical-orders` | Listar (opcional `?medicalCareId=`) |
| GET | `/api/medical-orders/{id}` | Obtener |
| POST | `/api/medical-orders` | Crear |
| PUT | `/api/medical-orders/{id}` | Actualizar |
| DELETE | `/api/medical-orders/{id}` | Eliminar |

**Prioridad (POST):** el DTO permite `priority` vacío o ausente; el servicio asigna **`NORMAL`** por defecto en ese caso. La intranet envía prioridad explícita (p. ej. `NORMAL`) por coherencia con el flujo de actualización, donde `priority` sigue siendo obligatorio.

## Laboratorio

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/laboratory` | Listar (opcional `?medicalOrderId=` devuelve un ítem) |
| GET | `/api/laboratory/{id}` | Obtener |
| POST | `/api/laboratory` | Crear |
| PUT | `/api/laboratory/{id}` | Actualizar (resultados, estado, etc.) |
| DELETE | `/api/laboratory/{id}` | Anulación lógica (`estado = ANULADO`) |
| POST | `/api/laboratory/{id}/attachment` | Subir o reemplazar adjunto (`multipart/form-data`, campo `file`) |
| GET | `/api/laboratory/{id}/attachment` | Descargar adjunto (binario) |
| GET | `/api/laboratory/{id}/attachment/metadata` | Metadatos del adjunto |
| DELETE | `/api/laboratory/{id}/attachment` | Eliminar adjunto (no permitido si `estado = COMPLETADO`) |

**Adjuntos (CU07 RN03):** PDF o imagen (JPEG, PNG, WebP), máximo **10 MB**. Metadatos en columna `adjunto` (JSON). Almacenamiento: disco local (`app.storage.type=local`, dev) o **Azure Blob Storage** (`app.storage.type=azure`, prod). **Regla:** `estado = COMPLETADO` exige adjunto válido previo vía `POST .../attachment`. El campo `attachment` en JSON create/update se ignora; usar endpoints dedicados.

## Imágenes

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/imaging` | Listar (opcional `?medicalOrderId=`) |
| GET | `/api/imaging/{id}` | Obtener |
| POST | `/api/imaging` | Crear |
| PUT | `/api/imaging/{id}` | Actualizar (informe, archivo, fechas) |
| DELETE | `/api/imaging/{id}` | Eliminar |

## Pagos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/payments` | Listar (opcional `?patientId=`) |
| GET | `/api/payments/{id}` | Obtener |
| POST | `/api/payments` | Crear |
| PUT | `/api/payments/{id}` | Actualizar |
| DELETE | `/api/payments/{id}` | Eliminar |

## Bitácora

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/audit-logs` | Listar (opcional `?module=` o `?userId=`; si hay `module` tiene prioridad) |
| GET | `/api/audit-logs/{id}` | Obtener |

Los eventos se registran **solo por vía interna** (`AuditLogService.recordEvent(...)`); no hay endpoint HTTP de alta. La auditoría de seguridad usa `SecurityAuditService` → `recordEvent` (módulo `security`).

---

## Errores

Las respuestas de error usan **`ApiErrorResponse`** con los campos JSON:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `timestamp` | string (ISO-8601) | Instante del error |
| `status` | number | Código HTTP (400, 401, 403, 404, 409, 500, …) |
| `error` | string | Razón estándar HTTP en inglés (`Bad Request`, `Unauthorized`, …) según `HttpStatus` |
| `message` | string | Mensaje orientado al usuario (**español** desde Fase 1.1) |
| `path` | string | Ruta solicitada |
| `fieldErrors` | array opcional | Lista de `{ "field", "message" }` en **400** por fallo de validación Bean Validation |

Incluye **401** (JWT inválido/expirado, no autenticado, login incorrecto), **403** (rol insuficiente) y el resto de códigos gestionados por `GlobalExceptionHandler` o el filtro JWT.

### Ejemplos (mensajes representativos)

**Validación DTO (400)** — `fieldErrors` puede venir con rutas de propiedad (p. ej. parámetros tipo record):

```json
{
  "timestamp": "2026-05-05T12:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Error de validación",
  "path": "/api/patients",
  "fieldErrors": [
    { "field": "firstName", "message": "El nombre es obligatorio" }
  ]
}
```

**Regla de negocio (400)**:

```json
{
  "timestamp": "2026-05-05T12:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "El código de paciente ya está en uso. Elija otro o use la sugerencia del sistema.",
  "path": "/api/patients",
  "fieldErrors": null
}
```

**Recurso no encontrado (404)**:

```json
{
  "timestamp": "2026-05-05T12:00:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "No se encontró el paciente: 999",
  "path": "/api/patients/999",
  "fieldErrors": null
}
```

**No autenticado / JWT inválido (401)**:

```json
{
  "timestamp": "2026-05-05T12:00:00Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Token inválido o expirado",
  "path": "/api/patients",
  "fieldErrors": null
}
```

**Permisos insuficientes (403)**:

```json
{
  "timestamp": "2026-05-05T12:00:00Z",
  "status": 403,
  "error": "Forbidden",
  "message": "Acceso denegado",
  "path": "/api/users",
  "fieldErrors": null
}
```

El **frontend intranet** debe mostrar preferentemente `message` y, en 400 con validación, concatenar o listar `fieldErrors` (ver `frontend/src/app/core/utils/http-error-message.ts`).

## Pruebas automatizadas

```bash
cd backend
mvn test
```

Las pruebas de Fase 7 usan `@WebMvcTest` (capa web sin PostgreSQL).
