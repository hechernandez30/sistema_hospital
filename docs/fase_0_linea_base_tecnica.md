# Fase 0 — Respaldo, estabilización y línea base técnica

**Proyecto:** Hospital H&H  
**Fecha de ejecución:** 5 de mayo de 2026  
**Alcance:** Verificación estática y compilación sin cambios de lógica funcional.  
**Correcciones de código:** Ninguna (compilación backend y build frontend **exitosos** en el primer intento).

---

## 1. Resultado de compilación backend

| Comando | Directorio | Resultado |
|---------|------------|-----------|
| `mvn -q clean compile` (sin tests) | `backend/` | **OK** — `exit code 0` |

**Nota:** No se ejecutó la suite de tests (`mvn test`); Fase 0 se limitó a compilación como acordado.

---

## 2. Resultado de build frontend

| Comando | Directorio | Resultado |
|---------|------------|-----------|
| `npm run build` (`ng build`) | `frontend/` | **OK** — `exit code 0`; salida en `frontend/dist/hospital-web` |

---

## 3. Endpoints REST encontrados

Prefijo base por defecto del servidor: `http://localhost:8080` (`server.port: 8080` en `application.yml`).

Todos los controladores revisados bajo `backend/src/main/java/com/hospital/*/controller/`.

| Área | Base path | Métodos y rutas |
|------|-----------|-----------------|
| Auth | `/api/auth` | `POST /login` |
| Roles | `/api/roles` | `GET`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| Usuarios | `/api/users` | `GET`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| Especialidades | `/api/specialties` | `GET`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| Personal (staff) | `/api/staff` | `GET`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| Pacientes | `/api/patients` | `GET`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| Seguros | `/api/patients/{patientId}/insurances` | `GET`, `GET /{insuranceId}`, `POST`, `PUT /{insuranceId}`, `DELETE /{insuranceId}` |
| Citas | `/api/appointments` | `GET`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| Admisiones | `/api/admissions` | `GET`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| Triage | `/api/triage` | `GET` (opcional `?admissionId=`), `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| Atenciones médicas | `/api/medical-cares` | `GET` (opcional `?patientId=`), `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| Órdenes médicas | `/api/medical-orders` | `GET` (opcional `?medicalCareId=`), `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| Laboratorio | `/api/laboratory` | `GET` (opcional `?medicalOrderId=`), `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| Imágenes | `/api/imaging` | `GET`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| Medicamentos | `/api/medications` | `GET`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| Pagos | `/api/payments` | `GET` (opcional `?patientId=`), `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| Bitácora | `/api/audit-logs` | `GET` (opcional `?module=&userId=`), `GET /{id}` |

**Documentación ampliada:** `backend/doc/API.md` (incluye tabla de roles por API).

---

## 4. Rutas Angular encontradas

### Raíz (`app.routes.ts`)

| Ruta | Destino |
|------|---------|
| `''` | Redirect → `p/inicio` |
| `p` | Lazy: `public.routes` |
| `app` | Lazy: `intranet.routes` |
| `**` | Redirect → `p/inicio` |

### Portal público (`/p/...`, `public.routes.ts`)

| Ruta público | Componente / título |
|--------------|---------------------|
| `/p` → `inicio` | Home |
| `/p/nosotros` | Quiénes somos |
| `/p/servicios` | Servicios |
| `/p/especialidades` | Especialidades |
| `/p/contacto` | Contacto |
| `/p/acceso` | Login (AuthService → `POST .../api/auth/login`) |

### Intranet (`/app/...`, `intranet.routes.ts`)

Todas detrás de **`authGuard`**; cada feature con **`roleGuard`** y `data.roles` según módulo.

| Ruta | Módulo |
|------|--------|
| `/app/panel` | Dashboard |
| `/app/pacientes` | Pacientes |
| `/app/citas` | Citas |
| `/app/admisiones` | Admisiones |
| `/app/triage` | Triage |
| `/app/atenciones` | Atenciones médicas |
| `/app/ordenes` | Órdenes médicas |
| `/app/laboratorio` | Laboratorio |
| `/app/imagenes` | Imágenes |
| `/app/medicamentos` | Medicamentos |
| `/app/pagos` | Pagos |
| `/app/bitacora` | Bitácora |
| `/app/usuarios` | Usuarios |
| `/app/roles` | Roles |
| `/app/personal` | Personal |
| `/app/especialidades` | Especialidades (gestión) |

---

## 5. Roles encontrados

### Backend (modelo de datos, `hospital_postgresql_15_tablas_es.sql`)

Nombres en tabla `roles`: **ADMINISTRADOR**, **MEDICO**, **MEDICO-JEFE**, **RECEPCIONISTA**, **CAJERO**, **FARMACIA**, **LABORATORIO**, **RRHH**, **AUDITOR**.

> **MEDICO-JEFE (9.3):** debe existir exactamente un usuario activo con este rol y personal tipo MEDICO. Al admitir paciente se auto-crea atención pendiente asignada a este médico. Ver `docs/fase_9_3_operacion_clinica_integrada.md`.

En JWT/autorización Spring Security se usan autoridades con prefijo **`ROLE_`** (p. ej. `ROLE_MEDICO`), según `backend/doc/API.md`.

### Backend (autorización HTTP, `SecurityConfig.java`)

Reglas principales (con `app.security.enabled=true`):

| Prefijo / condición | Roles permitidos |
|---------------------|------------------|
| `/api/users/**`, `/api/roles/**` | ADMINISTRADOR |
| `/api/audit-logs/**` | ADMINISTRADOR, AUDITOR |
| `/api/payments/**` | ADMINISTRADOR, CAJERO |
| `/api/medications/**` | ADMINISTRADOR, FARMACIA |
| `/api/laboratory/**` | ADMINISTRADOR, LABORATORIO, MEDICO |
| `/api/imaging/**` | ADMINISTRADOR, MEDICO |
| `/api/medical-orders/**` | ADMINISTRADOR, MEDICO, FARMACIA |
| `/api/medical-cares/**` | ADMINISTRADOR, MEDICO, **MEDICO-JEFE** |
| `/api/appointments/**` | ADMINISTRADOR, MEDICO, **MEDICO-JEFE**, RECEPCIONISTA |
| `/api/admissions/**` | GET: + MEDICO, MEDICO-JEFE, CAJERO; mutación: ADMINISTRADOR, RECEPCIONISTA |
| `/api/triage/**` | ADMINISTRADOR, RECEPCIONISTA |
| `GET /api/staff/**`, `GET /api/specialties/**` | ADMINISTRADOR, RRHH, **RECEPCIONISTA**, **MEDICO**, **MEDICO-JEFE** |
| `/api/staff/**`, `/api/specialties/**` (mutación) | ADMINISTRADOR, RRHH |
| `GET /api/patients/**` | ADMINISTRADOR, MEDICO, RECEPCIONISTA, CAJERO |
| Otros `/api/patients/**` (POST/PUT/PATCH/DELETE) | ADMINISTRADOR, MEDICO, RECEPCIONISTA |
| `/api/**` restante | ADMINISTRADOR |

### Frontend (`frontend/src/app/core/constants/role-routes.ts`)

Constantes `ROLE_*` alineadas con los nombres anteriores; agrupaciones por pantalla (`ROLES_PATIENTS`, `ROLES_APPOINTMENTS`, …) para `roleGuard`.

---

## 6. Configuración de seguridad relevante

| Aspecto | Ubicación / comportamiento |
|---------|----------------------------|
| JWT stateless | `JwtAuthenticationFilter`, `SessionCreationPolicy.STATELESS` |
| Seguridad activada por defecto | `application.yml` → `app.security.enabled: true` |
| Perfil **dev** API abierta | `application-dev.yml` → `app.security.enabled: false`; Swagger/OpenAPI habilitados |
| Rutas públicas (matcher único) | `HospitalPublicEndpointMatcher`: `OPTIONS /**`, `/error`, `GET /actuator/health`, `POST /api/auth/login`; en perfil `dev` también Swagger |
| CORS | `application.yml` → `app.cors.allowed-origins`: `http://localhost:4200`; dev añade más orígenes |
| JWT | `app.jwt.secret`, `app.jwt.expiration-minutes` en `application.yml` (secreto de ejemplo en repo; advertencia producción en `API.md`) |
| 401/403 | `RestAuthenticationEntryPoint`, `RestAccessDeniedHandler`; auditoría de seguridad vía `SecurityAuditService` (documentado en `API.md`) |
| springdoc default | `springdoc.*.enabled: false` en perfil por defecto |

---

## 7. Confirmación del alcance del portal público (CU01)

Verificación **en código Fase 0** (sin ejecutar E2E prolongado):

| Criterio | Hallazgo |
|----------|----------|
| Rutas públicas | Solo contenido informativo + login en `/p/acceso`. |
| Llamadas HTTP desde `/p/*` | `SpecialtiesComponent` usa `HttpClient` solo contra **`assets/data/specialties.json`** (estático empaquetado), **no** contra `/api`. |
| Resto de páginas públicas | Sin `HttpClient` hacia API en el árbol `public/` (grep en `*.ts`). |
| Login | `AuthService.login` → **`POST {apiUrl}/api/auth/login`**: es el punto legítimo de acceso de **personal autorizado** al backend; no equivale a registro de paciente ni reserva pública. |

**Conclusión:** Con el estado actual del frontend público, **no hay pantallas bajo `/p` que expongan CRUD u operaciones hospitalarias** contra la API; únicamente el flujo de login hacia el endpoint ya público por diseño (`POST /api/auth/login`). Cualquier cambio futuro que añada `HttpClient` al portal debe limitarse a **lectura de información pública** acordada y no mutar datos operativos.

---

## 8. Riesgos técnicos iniciales

1. **Perfil `dev` con `app.security.enabled=false`:** toda la API queda accesible sin JWT; riesgo si se despliega o se usa por error fuera de desarrollo local.
2. **Credenciales y secreto en YAML:** `spring.datasource.password` y `app.jwt.secret` en texto claro en `application.yml`; deben externalizarse para ambientes reales.
3. **Superficie pública mínima pero crítica:** `POST /api/auth/login` es vector de fuerza bruta si no hay políticas adicionales (rate limit no revisado en Fase 0).
4. **Documentación vs runtime:** La matriz real de permisos está en `SecurityConfig`; mantener `role-routes.ts` y `API.md` sincronizados en Fase 1+ evita 403 inesperados en UI.
5. **Tests no ejecutados:** posibles regresiones no detectadas hasta `mvn test` en fases posteriores.

---

## 9. Recomendación para iniciar Fase 1

Con la línea base **compilando y construyéndose sin errores**, es razonable **iniciar Fase 1 — Auditoría de modelos, DTOs y reglas transversales (CU05)** con:

1. Mensajes de validación y negocio en español coherentes (`GlobalExceptionHandler`, `BusinessRuleException`, anotaciones Jakarta).
2. Consolidar validaciones compartidas (email, teléfono, unicidad documentada) sin alterar contratos de API salvo acuerdo explícito.
3. Revisar consistencia **roles backend vs guards Angular** tras cualquier ajuste de DTOs.

**Tag o commit de línea base (recomendación de equipo):** registrar un commit o tag tipo `fase-0-linea-base` después de incorporar este documento, para poder comparar cambios de Fase 1.

---

*Fin Fase 0 — sin modificaciones de código aplicadas en esta ejecución.*
