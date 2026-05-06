# Fase 1.1 (parcial) — Mensajes y validaciones en español

Alcance aprobado: bloques **1**, **2** y **3** de la sección 8 de `docs/fase_1_auditoria_reglas_transversales.md` (mensajes globales, textos de excepciones de negocio / no encontrado, y `message` de anotaciones Jakarta en DTOs). Sin cambios de base de datos, sin cambio de contratos de API (rutas, códigos de estado, nombres de campos JSON), sin cambio de lógica de negocio ni de reglas funcionales (regex, campos obligatorios y anotaciones como `@Future` en citas se mantienen).

---

## Resumen de cambios

1. **Mensajes globales de error (API)** en español: manejo centralizado de excepciones, punto de entrada de autenticación JWT y manejo de acceso denegado, conservando `ApiErrorResponse` y los códigos HTTP habituales.
2. **Mensajes de `BusinessRuleException` y `ResourceNotFoundException`** en servicios de dominio listados en la fase, únicamente el texto visible.
3. **Atributo `message` en español** en restricciones Jakarta sobre DTOs de entrada (`*Request`, `LoginRequest`, etc.), sin alterar expresiones regulares ni qué campos son obligatorios.

---

## Archivos modificados

Salida de `git diff --name-only` en el estado del repositorio al cerrar la fase:

- `backend/src/main/java/com/hospital/admission/dto/AdmissionCreateRequest.java`
- `backend/src/main/java/com/hospital/admission/dto/AdmissionUpdateRequest.java`
- `backend/src/main/java/com/hospital/admission/service/AdmissionService.java`
- `backend/src/main/java/com/hospital/appointment/dto/AppointmentCreateRequest.java`
- `backend/src/main/java/com/hospital/appointment/dto/AppointmentUpdateRequest.java`
- `backend/src/main/java/com/hospital/appointment/service/AppointmentService.java`
- `backend/src/main/java/com/hospital/auditlog/dto/AuditLogCreateRequest.java`
- `backend/src/main/java/com/hospital/auditlog/service/AuditLogService.java`
- `backend/src/main/java/com/hospital/auth/dto/LoginRequest.java`
- `backend/src/main/java/com/hospital/exception/GlobalExceptionHandler.java`
- `backend/src/main/java/com/hospital/imaging/dto/ImagingStudyCreateRequest.java`
- `backend/src/main/java/com/hospital/imaging/dto/ImagingStudyUpdateRequest.java`
- `backend/src/main/java/com/hospital/imaging/service/ImagingStudyService.java`
- `backend/src/main/java/com/hospital/insurance/dto/InsuranceRequest.java`
- `backend/src/main/java/com/hospital/insurance/service/InsuranceService.java`
- `backend/src/main/java/com/hospital/laboratory/dto/LaboratoryCreateRequest.java`
- `backend/src/main/java/com/hospital/laboratory/dto/LaboratoryUpdateRequest.java`
- `backend/src/main/java/com/hospital/laboratory/service/LaboratoryService.java`
- `backend/src/main/java/com/hospital/medicalcare/dto/MedicalCareCreateRequest.java`
- `backend/src/main/java/com/hospital/medicalcare/dto/MedicalCareUpdateRequest.java`
- `backend/src/main/java/com/hospital/medicalcare/service/MedicalCareService.java`
- `backend/src/main/java/com/hospital/medicalorder/dto/MedicalOrderCreateRequest.java`
- `backend/src/main/java/com/hospital/medicalorder/dto/MedicalOrderUpdateRequest.java`
- `backend/src/main/java/com/hospital/medicalorder/service/MedicalOrderService.java`
- `backend/src/main/java/com/hospital/medication/dto/MedicationRequest.java`
- `backend/src/main/java/com/hospital/medication/service/MedicationService.java`
- `backend/src/main/java/com/hospital/patient/dto/PatientCreateRequest.java`
- `backend/src/main/java/com/hospital/patient/dto/PatientUpdateRequest.java`
- `backend/src/main/java/com/hospital/patient/service/PatientService.java`
- `backend/src/main/java/com/hospital/payment/dto/PaymentCreateRequest.java`
- `backend/src/main/java/com/hospital/payment/dto/PaymentUpdateRequest.java`
- `backend/src/main/java/com/hospital/payment/service/PaymentService.java`
- `backend/src/main/java/com/hospital/role/dto/RoleRequest.java`
- `backend/src/main/java/com/hospital/role/service/RoleService.java`
- `backend/src/main/java/com/hospital/security/HospitalUserDetailsService.java`
- `backend/src/main/java/com/hospital/security/RestAccessDeniedHandler.java`
- `backend/src/main/java/com/hospital/security/RestAuthenticationEntryPoint.java`
- `backend/src/main/java/com/hospital/specialty/dto/SpecialtyRequest.java`
- `backend/src/main/java/com/hospital/specialty/service/SpecialtyService.java`
- `backend/src/main/java/com/hospital/staff/dto/StaffCreateRequest.java`
- `backend/src/main/java/com/hospital/staff/dto/StaffUpdateRequest.java`
- `backend/src/main/java/com/hospital/staff/service/StaffService.java`
- `backend/src/main/java/com/hospital/triage/dto/TriageCreateRequest.java`
- `backend/src/main/java/com/hospital/triage/dto/TriageUpdateRequest.java`
- `backend/src/main/java/com/hospital/triage/service/TriageService.java`
- `backend/src/main/java/com/hospital/user/dto/UserCreateRequest.java`
- `backend/src/main/java/com/hospital/user/dto/UserUpdateRequest.java`
- `backend/src/main/java/com/hospital/user/service/UserService.java`

**No se modificó el frontend** (no fue necesario para compilación).

---

## Tipos de mensajes traducidos

| Tipo | Ubicación |
|------|-----------|
| Raíz de validación (`MethodArgumentNotValidException` / `ConstraintViolationException`) | `GlobalExceptionHandler` — mensaje raíz `"Error de validación"` |
| Autenticación fallida / JWT | `RestAuthenticationEntryPoint` — `"No autorizado"`, `"Token inválido o expirado"` |
| Permisos insuficientes | `RestAccessDeniedHandler` — `"Acceso denegado"` |
| Conflicto de integridad / error genérico | `GlobalExceptionHandler` — mensajes en español |
| Reglas de negocio y recursos no encontrados | Cadenas en `BusinessRuleException` y `ResourceNotFoundException` en servicios |
| Validación por campo | `message = "..."` en `@NotBlank`, `@NotNull`, `@Size`, `@Pattern`, `@Email`, `@Past`, `@Future`, `@AssertTrue`, `@Min` / `@Max`, `@DecimalMin` / `@DecimalMax` en DTOs |

El campo `error` de `ApiErrorResponse` sigue siendo la *reason phrase* estándar de HTTP (p. ej. `Bad Request`, `Unauthorized`), según `HttpStatus`; no se alteró la forma del JSON (`timestamp`, `status`, `error`, `message`, `path`, `fieldErrors` / `field` / `message`).

---

## Confirmaciones de alcance

- **Lógica funcional:** no se modificaron condiciones, flujos ni reglas de negocio; solo textos de mensajes y atributos `message` de validación.
- **Base de datos:** sin scripts ni cambios de esquema.
- **Contratos de API:** mismas rutas, mismos verbos, mismos códigos HTTP para los mismos casos, mismos nombres de propiedades en JSON de error.

---

## Resultado de compilación y pruebas

| Comando | Directorio | Resultado |
|---------|------------|-----------|
| `mvn -q clean compile test` | `backend/` | **Exit code 0** (compilación y tests, incl. pruebas WebMvc) |
| `npm run build` | `frontend/` | **Exit code 0** (`ng build` completado) |

---

## Smoke / revisión de ejemplos (estática + comportamiento esperado)

No se levantó el servidor para peticiones HTTP manuales en este cierre; la revisión se basa en el código y en que la suite de tests del backend pasó.

| Caso | Comportamiento esperado |
|------|-------------------------|
| Error de validación DTO | HTTP **400**, `message`: `"Error de validación"`, `fieldErrors` con `field` y `message` en español (p. ej. `"El nombre es obligatorio"`). |
| Error de negocio | HTTP **400**, `message` con el texto de `BusinessRuleException` en español. |
| Recurso no encontrado | HTTP **404**, `message` con el texto de `ResourceNotFoundException` en español. |
| 401 no autorizado | Sin JWT o inválido: `RestAuthenticationEntryPoint` devuelve `message` `"No autorizado"` o `"Token inválido o expirado"` según el atributo de fallo. |
| 403 acceso denegado | `RestAccessDeniedHandler` devuelve `message` `"Acceso denegado"`. |

---

## Ejemplos antes / después (representativos)

**Validación Jakarta (campo)**  
- *Antes (predeterminado del motor):* `"must not be blank"`  
- *Después:* `"El nombre de usuario es obligatorio"` (`LoginRequest.username`)

**Mensaje raíz de validación**  
- *Antes:* `"Validation failed"`  
- *Después:* `"Error de validación"`

**401 (API JSON)**  
- *Antes (texto habitual en cuerpo):* `"Unauthorized"`  
- *Después:* `"No autorizado"` (o mensaje de token inválido según el caso)

**403 (API JSON)**  
- *Antes (texto habitual en cuerpo):* mensaje en inglés  
- *Después:* `"Acceso denegado"`

**Patrón / catálogo (ej. personal)**  
- *Antes:* `message = "Invalid staffType"`  
- *Después:* texto en español describiendo los valores permitidos, **misma** `regexp`

---

## Riesgos y pendientes sugeridos para Fase 1.2

- **Centralización:** evaluar `ValidationMessages` / `messages.properties` para no duplicar cadenas en muchos DTOs.
- **Coherencia con documentación:** actualizar `backend/doc/API.md` u otros ejemplos si aún muestran textos en inglés de 401/403 o de validación.
- **Frontend:** mapear y mostrar `fieldErrors` y mensajes raíz en UI; revisar strings fijos en cliente que contradigan el backend.
- **Mensajes técnicos internos:** p. ej. configuración JWT (`IllegalStateException` en inglés) no forman parte de esta fase; si deben ocultarse al cliente, definir política en fases siguientes.

---

*Documento generado como entregable de Fase 1.1 parcial (bloques 1–3).*
