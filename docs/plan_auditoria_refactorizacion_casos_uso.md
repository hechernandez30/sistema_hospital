# Plan de Auditoría y Refactorización por Casos de Uso — Hospital H&H

## 1. Resumen ejecutivo

El sistema actual cuenta con un **backend Spring Boot** (API REST por dominio, JWT con `SecurityConfig`, DTOs con Jakarta Validation, manejo global de excepciones) y un **frontend Angular** (portal público bajo `/p/*`, intranet bajo `/app/*` con guards por rol). La **compilación del backend** (`mvn -DskipTests compile`) y el **build del frontend** (`ng build`) **completaron correctamente** en el entorno auditado (mayo 2026), lo que confirma una línea base técnica usable.

A nivel funcional, la cobertura frente a los **14 casos de uso oficiales** (`docs/casos_de_uso_detallados_corregido.md`) es **heterogénea**: varios flujos asistenciales tienen API y pantallas CRUD coherentes con el modelo SQL de referencia, pero **persisten brechas claras** en el **portal público informativo** (búsqueda de contenido público si aplica, médicos si aplica, accesibilidad), **reportes operativos (CU08)**, **farmacia tipo despacho con orden médica y movimientos de inventario (CU13)** y **auditoría de negocio transversal más allá de eventos de seguridad (CU05 RN04)**. Varias reglas están **solo parcialmente** reflejadas (notificaciones de citas, solapamiento de agenda, vínculo automático cobertura de seguro en pagos, validación explícita de “cita activa” antes de atención, etc.).

**Alcance del portal público (CU01):** el sitio externo es **únicamente institucional e informativo**. Cualquier alta de paciente, agenda de citas, admisión, pago u orden médica se realiza **solo en la intranet** por personal autorizado (véase la regla obligatoria en la metodología).

**Objetivo de este plan:** priorizar trabajo **incremental y verificable** por fases, alineando comportamiento observable (API + UI + seguridad + bitácora) con el documento oficial, sin asumir compleción por existencia de entidades o pantallas aisladas.

---

## 2. Metodología de revisión

1. **Lectura integral** del documento `docs/casos_de_uso_detallados_corregido.md` (única fuente funcional oficial para esta auditoría).
2. **Mapeo de implementación:**
   - Backend: paquetes bajo `backend/src/main/java/com/hospital/*` (`*Controller`, servicios clave y DTOs).
   - Frontend: rutas en `frontend/src/app/app.routes.ts`, `public/public.routes.ts`, `intranet/intranet.routes.ts`, y features bajo `frontend/src/app/features/*`.
   - Seguridad: `SecurityConfig`, `JwtAuthenticationFilter`, coincidencias con constantes `role-routes.ts`.
   - Bitácora: uso de `AuditLogService.recordEvent` (además del flujo descrito en `backend/doc/API.md`).
3. **Criterio de “completo”:** el flujo principal del CU puede ejecutarse de extremo a extremo conforme al **objetivo, RN y criterios implícitos** del documento, con validaciones que **impiden estados inválidos** y mensajes/comprensión de proceso alineados (no bastan pantallas CRUD inconexas).
4. **Estados de matriz:** *Completo*, *Parcial*, *No implementado*, *Requiere ajuste* (existe algo pero contradice CU o modelo mental del documento), *Requiere validación manual* (requiere UX/E2E o datos reales para certificar sin suposiciones).
5. **Exclusión explícita:** no se inventaron alcances nuevos más allá del documento; donde el modelo SQL difiere del texto del CU se señala como **riesgo de alineamiento** entre documentación y BD.

### Reglas obligatorias de alcance — Portal público (CU01)

El portal público no debe crear, modificar ni iniciar procesos operativos del hospital. No puede registrar pacientes, reservar citas, solicitar citas, crear admisiones, procesar pagos ni generar órdenes. Tampoco debe incluir formularios públicos ni enlaces que redirijan a visitantes hacia registro o reserva en módulos internos: esas acciones quedan **exclusivamente** en la intranet con autenticación y roles adecuados.

---

## 3. Matriz de cobertura por caso de uso

| CU | Nombre | Estado actual | Backend | Frontend | Seguridad/Roles | Reglas de negocio | Bitácora | Observaciones principales | Prioridad |
|----|--------|---------------|---------|----------|-----------------|-------------------|----------|---------------------------|-----------|
| CU01 | Portal Web del Hospital | Parcial | Parcial | Parcial | N/A público | Parcial | No | El portal público es informativo; requiere validar menú, contenido institucional, servicios, especialidades, médicos si aplica, contacto, buscador público si se implementa y acceso al login de personal autorizado. No debe permitir registro ni reserva pública. | Alta |
| CU02 | Registro de Paciente | Parcial | Parcial | Parcial | Cubierta en intranet | Parcial | No | DPI único y consentimiento OK; **código de paciente parece manual** vs generación/expediente en CU; mensajes backend frecuentemente en **inglés**; RN nombre 2–100 alfabético no acotado. | Alta |
| CU03 | Mantenimiento de Usuarios | Parcial | Parcial | Parcial | ADMIN | Parcial | No (CU pide auditoría cambios) | MFA flag sin segundo factor funcional conocido; **política de contraseña** no cumple CU (solo longitud); **rol único** vs “roles”; sin reglas conflicto Auditor/Operador. | Alta |
| CU04 | Consultas / Citas | Parcial | Parcial | Parcial | Por rol OK | Parcial | No | Conflictos solo **mismo instante de inicio**; sin sala; **duración vs especialidad (20–60 min)** sin validación vista en servicio; flags notificación sin envío efectivo. | Alta |
| CU05 | Reglas consolidadas | Parcial | Parcial | Parcial | Parcial RBAC | Parcial | Solo seguridad RN04 cumple solo en auditoría seguridad JWT/login/denied; pagos aplican porcentaje **sin RN06 automatizada** desde póliza. | Alta |
| CU06 | Muestras médicas | Requiere ajuste | Parcial | Parcial | LAB/MEDICO/ADMIN | Parcial | No | Solicitud aparece fusionada en **Laboratorio ligado a orden médica**, no caso independiente CU; formato expediente CU no verificado igual a `codigo_paciente`. | Media |
| CU07 | Laboratorio | Parcial | Parcial | Parcial | Por rol | Parcial | No | Estados modelo OK; adjuntos como **cadena sin límite MB** típico; notificación RN04 ausente; trazabilidad de cambios de estado vía tabla sí, auditoría usuario no homogénea. | Alta |
| CU08 | Reportes | No implementado | No implementado | No implementado | N/A | No | No | Sin catálogo/export PDF/Excel en código revisado. | Media |
| CU09 | Pagos y seguros | Parcial | Parcial | Parcial | CAJERO/ADMIN | Parcial | No | Descuento por **campo** `insurancePercent`, no verificación automática de póliza/cobertura por servicio; orden vinculada a `MedicalOrder` no idéntica a “identificador de orden” genérico del CU. | Alta |
| CU10 | Emergencias y Triage | Parcial | Parcial | Parcial | RECEPCIONISTA/ADMIN | Parcial | No | Signos vitales **no obligatorios** en DTO; FA01 paro no automatizado; asignación sala/médico por prioridad no modelada en servicio. | Alta |
| CU11 | Admisión | Parcial | Parcial | Parcial | RECEPCIONISTA/ADMIN | Parcial | No | **Validación financiera** y bloqueo sin seguro/pago bien encaminados; tipo ingreso y trazabilidad usuario requieren alinear con CU; integración cita/emergencia E2E manual. | Alta |
| CU12 | Atención médica | Parcial | Parcial | Parcial | MEDICO/ADMIN | Parcial | No | Mínimos clínicos con `@NotBlank` alineados; **permite episodio sin admisión ni cita** (solo nulls) → riesgo vs precondición CU; órdenes en módulo aparte asociadas a atención. | Alta |
| CU13 | Farmacia e inventario | Parcial | Parcial | Parcial | FARMACIA/ADMIN | Parcial | No | CRUD medicamento con stock; **falta despacho por orden**, descuento stock automático, movimientos trazables, reabastecimiento como proceso. | Alta |
| CU14 | Horarios y asistencia | Requiere ajuste | Parcial | Parcial | RRHH/ADMIN | Parcial | No | `horario` y `asistencia` en **texto** en entidad `personal`; sin motor de turnos ni detección de traslape; RN05 agenda vs horario activo no aplicada en `AppointmentService`. | Media |

---

## 4. Brechas funcionales detalladas por CU

### CU01 — Portal Web del Hospital

- **Qué pide el CU (alcance aprobado del proyecto):** Portal institucional público con **Inicio**, información institucional (**Quiénes somos** u equivalente), **Servicios**, **Especialidades**, **Médicos** si aplica como información pública, **Contacto**, **buscador de información pública** si se mantiene dentro del alcance, y **acceso al login de personal autorizado**. **No incluye** registro público de pacientes ni reserva pública de consultas; tampoco formularios ni flujos que creen o modifiquen pacientes, citas, admisiones, pagos u órdenes médicas.
- **Qué existe:** Rutas públicas `inicio`, `nosotros`, `servicios`, `especialidades`, `contacto`, `acceso` (login personal); menú toolbar consistente; contenido prototipo/listas estáticas en servicios/especialidades; sin operaciones internas expuestas en estas vistas en la revisión del plan.
- **Qué falta:** Buscador transversal de **información pública**, si se mantiene dentro del alcance; página o listado público de **Médicos**, si se mantiene dentro del alcance; validación visual/responsiva/accesibilidad; mensajes amigables cuando no haya resultados de búsqueda; revisiones de cumplimiento de suplementarios no funcionales del documento original donde sigan siendo aplicables al portal informativo (p. ej. métricas de navegación, si se acuerda). **No forma parte del alcance:** registro ni reserva pública.
- **Implementado diferente:** **“Acceso personal”** se mantiene como **entrada al login interno** para personal autorizado; **no** debe interpretarse como canal para pacientes o visitantes gestionar expediente, citas ni otros procesos operativos.
- **Riesgos:** Exponer por error operaciones internas desde el portal público; confundir al visitante con acciones de registro o reserva que **no** están aprobadas.
- **Recomendación:** Mantener el portal como **capa pública informativa**; cualquier registro de paciente, cita, admisión o pago debe realizarse **únicamente desde la intranet** por usuarios autorizados. Si se añaden APIs de solo lectura para contenido público, deben estar acotadas y sin mutación de datos operativos.

### CU02 — Registro de Paciente

- **Qué pide:** Formulario RN01–RN06; unicidad DPI; seguro opcional con aseguradora y póliza (RN07); generación/expediente y mensajes claros FA.
- **Qué existe:** `PatientCreateRequest` con email/tel/expresiones, `privacyAccepted` obligatorio, unicidad `dpiNit` y `patientCode` en servicio; API segreguros bajo `/api/patients/{id}/insurances`; UI pacientes intranet.
- **Qué falta:** RN02 validación nombre alfabética 2–100; número de paciente **generado por sistema** (hoy código enviado en request); UX registro combinado alta + seguro en un flujo CU; FA explícitos en UI; errores dominio en español uniforme (`BusinessRuleException` en inglés).
- **Implementado diferente:** Modelo SQL usa `codigo_paciente` único cargado manualmente desde cliente vs narrativa CU “genera número”.
- **Riesgos:** Duplicidad operativa código paciente/DPI gestionada sólo servidor; inconsistencia linguistic UX.
- **Recomendación:** Generador de código alineado a política institucional (y documento CU) + validadores compartidos (Fase 1).

### CU03 — Mantenimiento de Usuarios

- **Qué pide:** Listado filtros estado/rol/nombre; estados CU; unicidad correo corporativo FA02; política contraseña; compatibilidad roles FA01; MFA opcional.
- **Qué existe:** CRUD usuarios; unicidad usuario/email en servicio; estados persistidos tipo SQL (`ACTIVO`…); flag `mfaEnabled`.
- **Qué falta:** Validación Bean **mayúscula/minúscula/número** CU03 RN04; filtros servidor según CU; **conflicto roles** — modelo es **un rol por usuario**; MFA real (TOTP/OTP) si se reclama RN06; auditoría específica de cambios cuenta (CU poscondiciones).
- **Implementado diferente:** `UserCreateRequest` password `@Size(min=8)` sólo longitud.
- **Riesgos:** Cumplimiento de políticas de seguridad documentales vs implementación minimal.
- **Recomendación:** Decidir alcance MFA (solo flag vs flujo OTP) antes de refactor profundo.

### CU04 — Mantenimiento de Consultas / Citas

- **Qué pide:** Agenda diaria/semanal por médico; campos obligatorios; anti-solapamiento **médico+sala**; duración por especialidad; notificaciones 24h opcionales.
- **Qué existe:** Citas CRUD + validación fecha fin después de inicio; conflicto sólo mismo `doctor` + igual `startAt` entre activos; tabla `especialidades.duracion_minutos` en SQL.
- **Qué falta:** Solapamiento en **rangos**; entidad sala/no campo en revisión rápida; aplicar duración esperada especialidad (`20–60`) en validación creación/reprogramación; job/cola recordatorios (sin Redis/Kafka: scheduler simple o marca “pendiente envío”).
- **Implementado diferente:** Notificación modelada como booleanos cliente, sin canal.
- **Riesgos:** Doble ocupación mismo médico diferente overlap; incumplimiento RN03 texto CU.
- **Recomendación:** Query overlap por intervalo antes de nuevas restricciones de BD complejas.

### CU05 — Reglas de Negocio Consolidado

- **Qué pide:** Email/tel/formato DPI único/trazabilidad/RBAC/Seguros en descuentos.
- **Qué existe:** Patrones Jakarta en pacientes/usuarios; RBAC granular en `SecurityConfig`; descuentos pagos sólo matemática de porcentajes manuales; auditoría seguridad interna JWT/login (según API.md).
- **Qué falta:** Auditoría usuario/fecha/op **para operaciones clínicas y financieras**; español mensajes estándar; validación cobertura **antes** de registrar pago usando `Insurance` ligada paciente/servicio.
- **Implementado diferente:** N/A (documento consolidado — se evalúa transversalmente).
- **Riesgos:** Regresión reputacional/confidencialidad sin trazabilidad negocio.
- **Recomendación:** Fase seguridad/bitácora y Fase financiera enlazan esta RN.

### CU06 — Muestras médicas

- **Qué pide:** Formulario solicitante INT/EXT tipo MM/LQ descripción expediente formato patrón, FA externos con soporte.
- **Qué existe:** Laboratorio permite `INTERNO|EXTERNO`, `MUESTRA_MEDICA|LABORATORIO`; descripción muestra texto.
- **Qué falta:** Flujo desacoplado orden médica inicial si CU lo contempla así; RN longitud descripción (`10–2000`), RN expediente formato vs `Patient.patientCode` libre; FA datos soporte externos.
- **Implementado diferente:** Requiere **orden médica laboratorio** para crear registro Laboratorio dominante backend.
- **Riesgos:** Operaciones de laboratorio externo mal mapeadas.
- **Recomendación:** Ajustar válidos **sin romper CU12** ó documentar fusión CU06+C07 como decisión alcance institucional.

### CU07 — Laboratorio

- **Qué pide:** Cola pendientes/prioridades; recepción; resultados/adjuntos; estados Pendiente–Rechazado; notificación; trazabilidad cambios estado.
- **Qué existe:** Entidad+DTO estado `PENDIENTE|…|RECHAZADO`; flags muestra válida/recibida; timestamps recepción/resultado técnico; adjunto texto.
- **Qué falta:** **Límite 10MB**, upload binario típico; notificación automatizada médico solicitante (email interno/mock); garantizar prioridad orden/lab coherente con listado filtros CU.
- **Implementado diferente:** Adjuntos como string (base64/url) puede ser válido técnico pero sin validación RN03 documento.
- **Riesgos:** Almacén pesado/memoria si se abusa string adjunto.
- **Recomendación:** Validaciones tamaño y tipo MIME en capa servicio antes de persistir.

### CU08 — Reportes

- **Qué pide:** Catálogo reportes rol/área, filtros, export PDF/Excel, RN rangos fecha, métricas uso.
- **Qué existe:** No se localizaron controladores/feature “report” dedicados más allá de campos resultado en imágenes.
- **Qué falta:** Todo lo anterior.
- **Implementado diferente:** N/A.
- **Riesgos:** Gestión institucional sin insumos.
- **Recomendación:** Catálogo mínimo (p.ej. citas por período, ingresos, stock bajo) vía endpoints read-only antes de librerías PDF pesadas.

### CU09 — Pagos y Seguros

- **Qué pide:** Cobro orden/servicio; verificar seguro activo aplicable RN02 RN03; medios efectivo/tarjeta/transferencia; FA póliza vencida; recibo incluso \$0 FA02.
- **Qué existe:** `PaymentService` cómputo discount/copago/total; método pago necesario si estado `PAGADO`; referencia orden médica opcional admisión opcional.
- **Qué falta:** Derivación **`insurancePercent` desde tabla `seguros`** con vigencias y “cobertura aplicable servicio”; catálogo “conceptos línea” granular RN01 tipo factura; generación/recibo automatizado numero regla negocio; actualización orden/servicio “cerrada”.
- **Implementado diferente:** Validación financiera está más madura en **admisión** que en tiempo de cobro mismo (depende operador).
- **Riesgos:** Descuentos incoherentes con póliza real; errores financieros.
- **Recomendación:** Servicio único “InsuranceQuote” reutilizado admisión+pago.

### CU10 — Emergencias y Triage

- **Qué pide:** Signos obligatorios; categorías I–IV; tiempos objetivo; FA paro máxima prioridad; sala/médico asignación RN03.
- **Qué existe:** Triage enlazado a admisión campos numericos opcionales (no `@NotNull` global); patrones nombre prioridades alineadas a CU; métricas `targetMinutes`; UI triage/admisiones intranet.
- **Qué falta:** Obligatoriedad mínimos RN01; auto-set prioridad tiempo FA01; workflow asignación recursos físicos; vínculos enfermería vs médico permisos (hoy seguridad sólo RECEPCIONISTA+ADMIN sobre triage revisado — **roles enfermería/médico no listados igual** vs actores CU).
- **Implementado diferente:** Reglas pueden saltarse omitiendo valores en crear triage si UI lo permite vacío donde no hay validación combinada servidor.
- **Riesgos:** Clasificación clínico-legal incompleta.
- **Recomendación:** Validación clase-nivel `@AssertTrue` después de poblar valores por defecto de signos omitidos prohibidos.

### CU11 — Admisión de Paciente

- **Qué pide:** Búsqueda paciente; tipo ingreso consulta/emergencia/hospitalización RN01; cadena financiera RN03–RN05; ingreso numero trazabilidad RN06.
- **Qué existe:** `AdmissionService.ensureFinancialValidation` exige marcador financiero válido SEGURO con póliza activa fechas (`hasValidInsurance`) o `PAGO_SITIO`; estados rechazo libre de validación económica; campos financieros y observaciones UI.
- **Qué falta:** Restringir valores `admissionType` a catálogo CU; garantizar vínculos cita/consult externa donde aplique; auditoría campo dedicado persona admite (hay `admittedBy` parcial modelo).
- **Implementado diferente:** N/A crítico; implementación cercana intención CU.
- **Riesgos:** Tipos texto libres generan estadísticas/reportes inconsistentes después.
- **Recomendación:** Enum tipos/normalización español igual que otros catálogos.

### CU12 — Atención médica

- **Qué pide:** Precondición admisión o cita activa; lista pacientes médico; RN mínimos; órdenes asociadas episodio RN04 auditoría fecha/médico.
- **Qué existe:** Órdenes `MedicalOrder` contra `MedicalCare`; campos texto obligatorios crear atención; validación sólo rechaza combinación inconsistente admission null + appointment not null pero **admite admission null appointment null**.
- **Qué falta:** Regla fuerte CU FA01 antes create/update; vistas “mis pacientes hoy”; cerrar orden con checklist mínimo clínico extendido opcional historia (no sólo texto vacío tratamiento opcional permite null treatment ok).
- **Implementado diferente:** Flujo emergencia permite “huérfano” contra CU sin más contexto médico institucional.
- **Riesgos:** Ejecución de órdenes sin ingreso válido documentado.
- **Recomendación:** `validateAdmissionOrAppointmentActive` usando estados tabla `Admission`/`Appointment`.

### CU13 — Farmacia e inventario

- **Qué pide:** Lista órdenes pendientes dispensación RN01 validar stock decremento alertas mínimo movimientos trazables FA parcial/desabastecimiento.
- **Qué existe:** `MedicationService` gestiona existencias números mínimos; órdenes tipo `FARMACIA` pueden existir a nivel modelo.
- **Qué falta:** Entidad proceso **Dispensación** líneas cantidad médicamento orden; decremento stock atómico; integridad orden válida/expiración; registrar movimiento usuario hora RN05 CU13.
- **Implementado diferente:** Pantalla medicamentos tratada como inventario simple.
- **Riesgos:** Incumplimiento trazabilidad regulatoria instituciones similares.
- **Recomendación:** Nuevo bounded context despacho antes de más campos inventario auxiliares.

### CU14 — Horarios y asistencia

- **Qué pide:** Lista filtros RRHH RN01; definición turnos día/inicio/fin área RN02; ausencias RN03; conflicto traslapadas RN04; agenda usa sólo horario válido RN05.
- **Qué existe:** Campos únicos texto `schedule`/`attendance` en `Staff`; pantalla personal RRHH especialidades rutas Angular.
- **Qué falta:** Modelado relacional horarios recurrentes/conflict checker; automatizar integración disponibilidad en citas médicos.
- **Implementado diferente:** Texto vs estructuras temporales CU.
- **Riesgos:** Datos fantasía agendas médicas falsas funcionalesmente.
- **Recomendación:** Tablas pivote opcionales respetando justificación DDL futura proyecto.

---

## 5. Plan de implementación/refactorización por fases

### Fase 0 — Respaldo, estabilización y línea base

**Objetivo:** Confirmar proyecto compilable/versionado como punto de partida sin cambiar lógica.

- Validar compilación backend: **`mvn -DskipTests compile` OK** (auditoría).
- Validar build frontend: **`ng build` OK** (auditoría).
- Inventariar endpoints: revisión `backend/doc/API.md` y `*Controller` (pacientes, citas, admisiones, triage, atenciones, órdenes, laboratorio, imágenes, medicamentos, pagos, seguridad JWT, especialidades/staff seguros nested).
- Rutas Angular: público `/p/*`; intranet `/app/*` (panel, pacientes, citas, admisiones, triage, atenciones, órdenes, laboratorio, imágenes, medicamentos, pagos, bitácora, usuarios/roles/personal/especialidades).
- Roles backend `SecurityConfig` vs frontend `role-routes.ts`: alinear nombres `ROLE_*` para no romper UX.
- Revisión `application.yml` / JWT / `app.security.enabled` (perfil dev abierto solo desarrollo comprendido).
- **Sin cambiar** reglas funcionales durante esta fase más que commits de línea base.

### Fase 1 — Auditoría de modelos, DTOs y reglas transversales (CU05)

**Objetivo:** Unificar mensajes español donde negocio ve usuario; validadores email/tel/DPI/coherencia nombres; preparar unicidad/formato; para el portal público, cualquier contenido adicional debe ser **solo informativo** (sin formularios operativos ni enlaces a registro/reserva pública).

**Incluye:** patrones Jakarta compartidos; mensajes `@Pattern` español en capa DTO; nombre paciente CU02; reconsiderar generación `codigo_paciente`; validación seguros entradas; revisión errores inglés (`BusinessRuleException`), `GlobalExceptionHandler` wording; opcional tabla convenios cuando justifique DDL.

### Fase 2 — Seguridad, roles y bitácora

**Objetivo:** Robustecer S2/S3 y RN04 negocio allí donde aplique CU.

**Incluye:** confirmar rutas públicas sin exposición accidental `/api`; revisar JWT inválidos y 401 (`ApiErrorResponse`); granularidad roles enfermería/médicos triage/atenciones según institución; registrar eventos auditoría cambios alto impacto (**admisión, pago, despacho**, alteración stock) mediante `AuditLogService` sin duplicar listas públicas; validar Angular no llama rutas forbidden.

### Fase 3 — Módulos administrativos base (CU02, CU03, CU14)

**Objetivo:** Base pacientes/usuarios/RRHH sólida.

**Incluye:** pacientes+seguros UI (flujo combinado donde CU lo requieran); filtros usuarios; políticas contraseña; decision MFA; personal con **hora inicio/fin/día struct** incremental ( DDL justificado ); asistencias catálogo **PRESENTE|…** UI select; filtros RRHH CU14 RN01; bloque líder traslapes.

### Fase 4 — Agenda, admisión, entrada paciente (CU04, CU11, CU10)

**Objetivo:** Canalizar ingreso institucional.

**Incluye:** motor conflictos agendas intervalo; sala (si institución asignó columna próxima o mapping virtual); usar `duracion_minutos` especialidad; notificaciones (stub + cola interna DB); admisión catálogo tipos; triage validación signos mínimos; roles enfermería; protocolo FA paro (flag prioridad I); integración triage→admisión→atención pruebas.

### Fase 5 — Atención médica y órdenes clínicas (CU12, CU06, CU07)

**Objetivo:** Cerrar circuito clínico diagnóstico.

**Incluye:** bloqueo atención sin ingreso válido; órdenes laboratorio/imagen/farmacia ya parcial — alinear estados y prioridades; laboratorio adjuntos validados; notificación interna completado; CU06 validaciones descripción/expediente o decisión formal fusión con CU07.

### Fase 6 — Pagos, seguros, farmacia (CU09, CU13)

**Objetivo:** Coherencia financiera y suministro.

**Incluye:** resolución automática descuento seguro activo; copago; recibo; cierre orden; despacho farmacia con stock transaccional y movimientos; alertas mínimo; parcial stock UI FA.

### Fase 7 — Reportes y portal (CU08, CU01)

**Objetivo:** Visibilidad externa e interna.

**Incluye:** catálogo reportes read-only; export formatos mínimos; rangos validados; **portal público institucional:** Inicio, información institucional, servicios, especialidades, médicos si aplica, contacto, buscador público si aplica y acceso al login de personal autorizado. **Confirmar** que no existan formularios ni enlaces de registro/reserva pública. FA conectividad en portal informativo (p. ej. mensaje si falla carga de contenido público).

### Fase 8 — Pruebas E2E funcionales

**Objetivo:** Escenarios listados por usuario (registro→cita→admisión consulta/emergencia→triage→atención→lab resultado→pagos con/sin seguro→farmacia suficiente/insuficiente→reporte→roles).

**Incluye:** matriz evidencia/manual o Cypress/Playwright futuro sólo cuando se establezca — documentar resultado.

### Fase 9 — Cierre técnico y documentación

**Objetivo:** Fotografía final proyecto.

**Incluye:** matriz CU estado final vs este plan; tabla endpoints clave tabla rutas Angular roles JWT; datos prueba ejemplo `API.md`; pendientes explícitos; evidencia comandos compilación reproducibles CI local.

---

## 6. Orden recomendado de ejecución

1. **Fase 0** siempre primera (baseline + tag git recomendado).
2. **Fase 1** antes de grandes UI nuevas para no duplicar validaciones.
3. **Fase 2** paralelizable contenida pero preferible tras Fase 1 si mensajes seguridad español institucional.
4. **Fases 3→4→5→6** en orden porque dependencias flujo paciente físico-financiero.
5. **Fase 7** cuando datos internos estén limpios (reportes tienen sentido sólo tras modelos financieros/clínicos fiables).
6. **Fases 8 y 9** cerrar incrementalmente cada mega-fase menor (micro releases internas).

**Por qué:** minimiza refactor doble sobre mismos controladores (`Appointment`, `Payment`, `MedicalCare`) cuando reglas endurecen.

---

## 7. Riesgos detectados

| Tipo | Riesgo |
|------|--------|
| Funcional | Atenciones o triage cursables sin cerrar todas precondiciones documentales CU10/CU12. |
| Funcional | Pagos pueden reflejar descuentos inconsistentes sin amarre póliza. |
| Funcional | Farmacia incapaz cerrar ciclo médico institucional. |
| Funcional | Portal informativo (búsqueda pública/médicos si aplica) incompleto frente al alcance aprobado. |
| Funcional | Riesgo de exponer u ofrecer en portal público operaciones internas (registro, citas, etc.) contrario a la regla obligatoria de alcance. |
| Técnico | `app.security.enabled=false` desarrollo debe nunca llegar staging/producción inadvertido. |
| Técnico | Mensajes inglés dispersos confunden operadores hispanohablantes. |
| Integración Front-Back | Desalineación permisos rutas Angular vs nuevos fines endpoints causa 403 silencioso UX malo si no manejado mensaje español estándar. |
| Datos/SQL | Cualquier columna nueva (turnos sala despacho) requiere justificación explícita en AGENTS proyecto. |

---

## 8. Recomendaciones para Cursor en iteraciones futuras

1. **Módulos acotados por PR/fase**: no mezclar laboratorio+pago+farmacia un solo mega diff salvo necesidad fuerte merge.
2. **Contratos API**: antes de cambiar request/response, buscar todas referencias Angular `features/*/services` y tests `*WebMvcTest`.
3. **Compilación/built tras cada fase**: `mvn test` cuando existan pruebas afectadas; `ng build` tras cambios estructuras rutas standalone.
4. **Commits/atoms**: etiqueta `phase-N-descripcion-corta` recomendación git convenciones equipo.
5. **Compatibilidad**: preferir `@Deprecated` campo legacy breve período sólo si clientes externos (no caso single SPA conocido pero prudencia).
6. **Documentar decisiones alcance**: p.ej fusión CU06 en CU07 requiere comentario en `docs/` aprobación stakeholders para no parecer omisión técnica.
7. **No asumir reportes/imagen/farmacia “listos”** sin ejecutar caso manual asociado cada RN crítico.
8. **Portal público (CU01):** no añadir formularios ni llamadas que creen o alteren datos operativos; no enlazar a registro/reserva pública; el login sigue siendo para **personal autorizado** únicamente.

---

*Documento generado en revisión estática mayo 2026; clasificaciones “Parcial/Requiere ajuste” deben refinarse tras pruebas E2E institucionales en Fase 8.*
