# Fase 1 — Auditoría de modelos, DTOs y reglas transversales

**Proyecto:** Hospital H&H  
**Fecha:** 5 de mayo de 2026  
**Tipo:** Auditoría y propuesta — **sin cambios de código** en esta ejecución.  
**Línea base:** `docs/fase_0_linea_base_tecnica.md` se mantiene como evidencia oficial de la Fase 0.  
**Alcance CU01:** Portal público solo informativo (sin registro/reserva pública); esta fase no lo modifica.

---

## 1. Resumen ejecutivo

El backend aplica **Jakarta Validation** en la mayoría de DTOs de entrada y concentra reglas de negocio en servicios (`BusinessRuleException`, `ResourceNotFoundException`). Los mensajes al cliente son **mayoritariamente en inglés** en tres capas: anotaciones `@Pattern` / default de Bean Validation, `GlobalExceptionHandler` (mensaje raíz de validación, 401, 403, 500, integridad) y textos de `BusinessRuleException` / `ResourceNotFoundException`. El frontend intranet replica **parcialmente** las reglas (pacientes, pagos, triage y otros formularios con `Validators` y utilidades en `form-validators.ts`), con **desalineaciones** en nombres (CU02), contraseñas (CU03), citas (`@Future` en backend), órdenes médicas (prioridad obligatoria en update DTO pero opcional en create), personal (asistencia opcional en UI) y triage (vitales opcionales frente a CU10).

Las reglas **CU05** están **parcialmente** cubiertas: email/tel/DPI único y RBAC sí; trazabilidad de negocio amplia y aplicación automática de seguro en pagos **no**. Se recomienda una **Fase 1.1** incremental: español en mensajes y anotaciones, alineación de validaciones simples DTO ↔ Angular, sin DDL ni cambios de contrato de campos obligatorios salvo acuerdo explícito.

---

## 2. Reglas CU05 evaluadas

Referencia: `docs/casos_de_uso_detallados_corregido.md` — CU05.

| Regla CU05 | Descripción breve | Estado | Backend | Frontend | Observación | Acción recomendada (Fase 1.1+) |
|------------|-------------------|--------|---------|----------|-------------|--------------------------------|
| RN01 | Formato correo tipo usuario@dominio | **Parcial** | `@Email` en paciente/usuario; SQL CHECK en BD | `optionalEmail` / `Validators.email` en algunos formularios | Mensajes default Jakarta a menudo en inglés | Mensajes `@Email`/`@Pattern` en español; unificar función email opcional/obligatorio |
| RN02 | Teléfono: solo dígitos, 8–15, opcional `+` | **Implementada diferente** | Regex `^\+?[0-9]{8,15}$` paciente/usuario coincide con idea RN02 | `PHONE_BACKEND_PATTERN` alineado en pacientes | Vacío vs `null` en JSON puede chocar con `@Pattern` si se envía `""` desde cliente | Documentar payloads; opcional usar `@Pattern(..., regexp="^$|...")` donde aplique sin romper contrato |
| RN03 | Identificación única (DPI/NIT) | **Parcial** | Unicidad en `PatientService` | Frontend: patrón alfanumérico `DPI_NIT_PATTERN`; sin unicidad hasta respuesta servidor | CU pide unicidad DPI; no hay formato DPI fijo en CU vs patrón amplio en Angular | Mantener unicidad en backend; alinear mensajes duplicado en español |
| RN04 | Trazabilidad: usuario, fecha, operación en auditoría | **Parcial** | `SecurityAuditService` → bitácora para login/JWT/denegado | N/A | Auditoría de **operaciones de negocio** (CRUD clínico/financiero) no homogénea en servicios | Fase 2+ o 1.1 solo si se acota “mensaje” sin nuevos eventos |
| RN05 | RBAC en módulos críticos | **Implementada** | `SecurityConfig` + JWT | `roleGuard` + constantes `role-routes.ts` | Coincidencia documentada en Fase 0; 403 body `"Forbidden"` en inglés | Fase 1.1: mensaje 403/401 en español para usuarios internos |
| RN06 | Validar póliza activa y cobertura antes de descuento | **No implementada** en flujo pago | `AdmissionService.hasValidInsurance` para admisión; `PaymentService` usa `insurancePercent` del request | Formulario pago exige porcentaje manual | No hay enlace automático póliza→porcentaje al guardar pago | Decisión funcional; Fase 1.1 solo mensajes; lógica en fase financiera |
| RN07 | Descuento por convenio si seguro activo | **Parcial** | Cálculo `computeInsuranceDiscount` si hay porcentaje | Igual desde UI | Depende de operador; no valida RN06 antes | Ídem RN06 |

---

## 3. Validaciones encontradas en DTOs backend

Resumen por módulo (campos representativos; no lista exhaustiva campo a campo donde se repiten patrones).

| Módulo | DTO | Campo / tema | Validación actual | Cumple CU | Observación |
|--------|-----|----------------|-------------------|-----------|-------------|
| Paciente | `PatientCreateRequest` / `PatientUpdateRequest` | `patientCode` | `@NotBlank` `@Size(max=30)` | Parcial CU02 | CU habla de generación de número expediente — decisión pendiente fuera Fase 1.1 |
| Paciente | idem | `firstName` / `lastName` | `@NotBlank` `@Size(max=100)` | Parcial CU02 RN02 | Sin regex 2–100 “alfabético” del CU |
| Paciente | idem | `dpiNit` | `@NotBlank` `@Size(max=30)` | Parcial RN03 | Formato DPI no validado en DTO (solo unicidad en servicio) |
| Paciente | idem | `phone` | `@Pattern(^\+?[0-9]{8,15}$)` | Sí RN02 | Opcional solo si `null`; cadena vacía puede fallar |
| Paciente | idem | `email` | `@Email` `@Size(max=150)` | Sí RN01 | Mensaje inglés típico de `@Email` |
| Paciente | idem | `birthDate` | `@NotNull` `@Past` | Sí | — |
| Paciente | idem | `privacyAccepted` | `@NotNull` `@AssertTrue` | Sí CU02 RN06 | Mensaje ya en inglés con texto usable |
| Usuario | `UserCreateRequest` | `password` | `@NotBlank` `@Size(min=8,max=255)` | **No** CU03 RN04 | Falta mayúscula/minúscula/dígito en validación |
| Usuario | `UserUpdateRequest` | `password` | `@Size(min=8,max=255)` opcional | **No** | Igual |
| Usuario | `UserUpdateRequest` | `state` | `@Pattern(ACTIVO\|…)` | Sí | Mensaje en inglés |
| Cita | `AppointmentCreate/Update` | `startAt` / `endAt` | `@NotNull` `@Future` | **Requiere decisión** | Impide registrar citas con inicio en el pasado (reprogramación/histórico) |
| Cita | idem | `reason` | `@Size(max=250)` | Sí CU04 motivo opcional | — |
| Admisión | `AdmissionCreate/Update` | `admissionType`, `status`, `validationSource` | `@Pattern` catálogos | Sí CU11 | Mensajes `Invalid…` en inglés |
| Admisión | `AdmissionCreate` | `financialValidationOk` | `Boolean` sin `@NotNull` | Parcial | Regla fuerte en `AdmissionService`, no en DTO |
| Triage | `TriageCreate/Update` | Signos vitales | `@Min/@Max` pero **sin `@NotNull`** | **No** CU10 RN01 | Todos los signos pueden omitirse (null) |
| Triage | idem | `priority` | `@NotBlank` `@Pattern(I_CRITICO\|…)` | Sí | — |
| Atención médica | `MedicalCareCreate/Update` | Textos clínicos | `@NotBlank` motivo/eval/diagnóstico | Sí CU12 RN02-RN03 | `treatmentPlan` opcional en create |
| Orden médica | `MedicalOrderCreate` | `priority` | Sin `@NotBlank` | Parcial | `AppointmentService`/servicio orden puede asumir default; **update** sí exige prioridad `@NotBlank` |
| Laboratorio | `LaboratoryCreate/Update` | `sampleDescription` | Sin `@NotNull`/`@Size` min | **No** CU06 RN04 longitud | — |
| Pago | `PaymentCreate/Update` | montos | `@DecimalMin/@DecimalMax` | Parcial CU09 | `insurancePercent` siempre `@NotNull` 0–100 aun sin seguro |
| Medicamento | `MedicationRequest` | stock | `@NotNull` `@Min(0)` | Parcial CU13 | Sin tope máximo ni validación orden al crear medicamento |
| Personal | `StaffCreate/Update` | tipo, código, asistencia | `@Pattern` acorde SQL | Parcial CU14 | Horario texto libre `@Size(max=100)` |
| Especialidad | `SpecialtyRequest` | `durationMinutes` | `@Min(20)` `@Max(60)` | Sí CU04 RN04 idea | — |
| Seguro | `InsuranceRequest` | cobertura | `@DecimalMin/Max` 0–100 | Parcial CU09 | Fechas/active sin regla cruzada “póliza activa” en DTO |

---

## 4. Reglas encontradas en servicios backend

| Módulo | Servicio | Regla encontrada | Cumple CU | Riesgo | Recomendación |
|--------|----------|------------------|-----------|--------|---------------|
| Paciente | `PatientService` | Unicidad `patientCode`, `dpiNit` | Sí RN03 (DPI) | Mensajes inglés | Traducir `BusinessRuleException` |
| Usuario | `UserService` | Unicidad `username`, `email` | Sí CU03 RN01 | Sin política contraseña | Fase 1.1: validador custom o `@Pattern` acordado |
| Personal | `StaffService` | Unicidad `employeeCode` | Parcial CU14 | Inglés | Traducir mensajes |
| Cita | `AppointmentService` | Estados permitidos; fin > inicio; conflicto mismo médico + mismo `startAt` | Parcial CU04 | No valida solape por intervalo ni sala | Fuera Fase 1.1 mínima; documentar |
| Admisión | `AdmissionService` | `ensureFinancialValidation`: SEGURO con póliza activa por fechas o PAGO_SITIO; bloqueo si no OK | Sí CU11 | Inglés | Traducir excepciones |
| Atención | `MedicalCareService` | Propiedad paciente-admisión-cita; “consulta normal requiere admisión” si hay cita sin admisión | **Parcial** CU12 | Permite **sin** admisión y **sin** cita (ambos null) | Fase posterior: regla explícita precondición CU |
| Orden | `MedicalOrderService` | Tipos y estados enumerados | Sí | Inglés | Traducir |
| Laboratorio / Imagen | `LaboratoryService` / `ImagingStudyService` | Orden debe ser tipo LAB/IMAGEN; una fila por orden | Sí | Inglés | Traducir |
| Pago | `PaymentService` | Coherencia paciente-admisión-orden; total no negativo; método si PAGADO | Parcial CU09 | No valida seguro activo al aplicar % (CU05 RN06) | Decisión + fase financiera |
| Rol / Especialidad / Seguro / Aud… | Varios | `ResourceNotFoundException` estándar | N/A | Textos inglés | Traducir o capa i18n |
| Bitácora | `AuditLogService` | IP inválida `BusinessRuleException` | N/A | Inglés | Traducir |

**Permisos adicionales en servicio:** no se detectó lógica de negocio de roles más allá de Spring Security en los servicios auditados (correcto para capa actual).

---

## 5. Mensajes de error y validación

Muestra representativa; patrón general: **raíz en inglés** + detalles de campo mezclados.

| Archivo / clase | Mensaje actual (ejemplo) | Problema | Mensaje recomendado (español) — propuesta |
|-----------------|-------------------------|----------|-------------------------------------------|
| `GlobalExceptionHandler` | `Validation failed` | Raíz genérica en inglés | `Error de validación` |
| `GlobalExceptionHandler` | `Unauthorized` | 401 genérico | `No autorizado` |
| `GlobalExceptionHandler` | `Data integrity violation` | Conflicto BD | `Conflicto de datos o restricción en base de datos` |
| `GlobalExceptionHandler` | `Unexpected error` | 500 | `Error interno inesperado` |
| `RestAuthenticationEntryPoint` | `Invalid or expired token` | JWT | `Token inválido o expirado` |
| `RestAccessDeniedHandler` | `Forbidden` | 403 | `Acceso denegado` |
| `PatientService` | `Patient code already exists` | Negocio inglés | `El código de paciente ya existe` |
| `PatientService` | `DPI/NIT already exists` | Idem | `El DPI/NIT ya está registrado` |
| `UserService` | `Email already exists` | Idem | `El correo ya está registrado` |
| `AppointmentService` | `Doctor already has an active appointment at this start time` | Idem | `El médico ya tiene una cita activa en esa fecha y hora de inicio` |
| `MedicalCareService` | `Normal consultation requires an admission` | Idem | `La consulta programada requiere una admisión válida` |
| `AdmissionService` | `Financial validation is required for admission` | Idem | `Se requiere validación financiera para admitir` |
| DTO `@Pattern` varios | `Invalid …` / `sex must be M, F or OTRO` | Validación inglés | Textos cortos en español por campo |

**Login:** Las excepciones de Spring Security en login pueden propagarse con mensajes en inglés según configuración; conviene revisar punto único en Fase 1.1 junto al handler global.

---

## 6. Validaciones frontend encontradas

| Pantalla / módulo | Campo | Validación frontend | Coincide con backend | Observación |
|-------------------|-------|---------------------|----------------------|-------------|
| Pacientes | Código, nombres, DPI, fecha, sexo, consentimiento | Requeridos, tamaños, `DPI_NIT_PATTERN`, `@Past`-like | **Parcial** | Frontend exige formato DPI más restrictivo que DTO backend; teléfono opcional creación pero obligatorio edición si tenía valor |
| Usuarios | email, nombre, rol, estado, contraseña | `Validators.email`, `minLength(8)` creación | **Parcial** | Sin regla mayúsc/minúc/dígito CU03 |
| Citas | fechas, estado, motivo | `required` fechas/estado; `maxLength(250)` motivo | **Parcial** | Backend `@Future` puede rechazar fechas que UI permite en escenarios históricos |
| Admisiones | IDs, tipo, estado (edición), check financiero | Enteros positivos; listas desplegables | **Parcial** | Reglas financieras finas en backend; UI no obliga texto de error backend en español |
| Triage | admissionId, vitales, prioridad | Rangos opcionales; prioridad required | **Parcial** | Backend permite vitales null — mismo “hueco” que CU10 |
| Atenciones | textos largos | `required` + `maxLength` | **Razonable** | Límites frontend no siempre iguales a ausencia de `@Size` en backend en todos los textos |
| Laboratorio | recordNumber, status, etc. | `maxLength(40)`; status required | **Parcial** | Sin `min` descripción muestra CU06 |
| Medicamentos | nombre, stocks | required nombre; números | **Parcial** | Stocks required en frontend alineados a `@NotNull` `@Min(0)` |
| Pagos | montos, % seguro, concepto | Rangos decimal; catálogo estado | **Parcial** | Mismo gap RN06 automatización seguro |
| Personal | código, tipo, asistencia | required tipo/código; asistencia **sin** Validators.pattern | **Parcial** | Envío puede fallar si asistencia vacía/incorrecta respecto `@Pattern` backend |

---

## 7. Brechas prioritarias

### Alta prioridad

- Mensajes **`GlobalExceptionHandler`**, **403/401** de seguridad, **`BusinessRuleException`** y **`ResourceNotFoundException`** frecuentes en inglés.
- **CU03:** contraseña sin complejidad en DTO (solo longitud).
- **CU12 / MedicalCare:** admisión+cita opcionales todas (incumbe precondición CU sin decisión formal).
- **CU10:** signos vitales no obligatorios en DTO ni forzados en frontend.

### Media prioridad

- Alineación **nombre paciente** con RN02 CU02 (regex/ longitud mínima) sin cambiar tamaño BD.
- **`@Future`** en citas vs escenarios de carga de datos históricos o reprogramación.
- **Orden médica:** prioridad obligatoria en `MedicalOrderUpdateRequest` pero opcional en create.
- **Teléfono vacío `""`** vs null en payloads JSON frente a `@Pattern`.

### Baja prioridad

- Mensajes `@Pattern` en DTO campo a campo en español.
- Límites `maxLength` exactos texto clínico create vs update en todos los campos.
- Auditoría RN04 más allá de seguridad (planificar Fase 2).

---

## 8. Propuesta de ejecución técnica para Fase 1.1

Objetivo: cambios **pequeños, reversibles**, sin DDL, sin nuevos endpoints públicos, sin ampliar CU01.

Orden sugerido:

1. **Mensajes globales en español**  
   - `GlobalExceptionHandler`: textos raíz (`Validation failed`, `Unauthorized`, etc.).  
   - `RestAuthenticationEntryPoint`, `RestAccessDeniedHandler`: cuerpo `message` en español.  
   - Revisión de que `ApiErrorResponse.error`/`status` puedan mantener reason phrase estándar o documentar decisión.

2. **Traducción de textos `BusinessRuleException` y `ResourceNotFoundException`** en servicios usados por la intranet (paciente, usuario, cita, admisión, pago, orden, staff, laboratorio, imagen) — mismo significado, sin cambiar código HTTP.

3. **Mensajes de anotaciones Jakarta**  
   - Sustituir `message = "Invalid..."` en DTOs por equivalentes en español (mismo `regexp`).  
   - Añadir `message` explícito en `@Email`/`@NotBlank` donde el default sea inglés.

4. **Frontend**  
   - Snackbars / `getHttpErrorMessage`: si ya muestran `message` del backend, el paso 2–3 mejora UX sin tocar cada componente.  
   - Ajustar **solo donde haya mismatch claro** (ej. asistencia personal con select obligatorio acorde a catálogo SQL) — sin rediseño de formularios.

5. **No incluir en 1.1** (salvo nueva decisión): política fuerte CU03 MFA/TOTP; solape citas; regla “admisión o cita activa” obligatoria en MedicalCare; automación seguro→pago; vitales obligatorios triage (implica decisión clínica y posible rechazo UX).

**Pruebas mínimas tras 1.1:** `mvn test` focalizado en controladores si existieran asserts de mensaje; `ng build`; smoke manual crear paciente/usuario con error de validación.

**Recomendación:** Tras cerrar documentación Fase 1, **aprobar Fase 1.1** empezando por mensajes globales + excepciones de dominio repetidas para máximo impacto con mínimo riesgo.

---

## 9. Nota de cierre (posterior a Fase 1.1 / 1.2)

- **Fase 1.1** aplicó mensajes en español en backend (manejadores globales, excepciones de negocio, anotaciones Jakarta en DTOs). La tabla del §1 sobre “mensajes mayoritariamente en inglés” describe la línea base **antes** de esa fase.
- **Fase 1.2** actualizó documentación (`backend/doc/API.md`) y la visualización de errores en el frontend intranet (`getHttpErrorMessage`, login alineado con el mismo helper), incluyendo `message` del cuerpo y resumen de `fieldErrors` en snackbars, sin cambiar contratos ni reglas funcionales.

---

*Auditoría Fase 1 completada sin modificación de código en la ejecución original. Referencia oficial Fase 0: `docs/fase_0_linea_base_tecnica.md`.*
