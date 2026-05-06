# Fase 1.3 — Validaciones simples y seguras

**Fecha:** 5 de mayo de 2026  
**Objetivo:** Cerrar brechas menores detectadas en la auditoría Fase 1 sin DDL, sin cambio de nombres de campos, sin nuevos endpoints ni lógica financiera ampliada.

---

## Qué se modificó

### 1. Política de contraseña (CU03)

- **Backend:** `UserCreateRequest` mantiene `@NotBlank`, `@Size(min=8,max=255)` y se añadió `@Pattern` con lookahead: al menos una minúscula, una mayúscula y un dígito (`8–255` caracteres totales coherente con el patrón).
- **Backend:** `UserUpdateRequest` — `password` opcional: `@Pattern` con prefijo `^$|` para cadena vacía o el mismo criterio de complejidad cuando se envía valor.
- **Frontend:** validadores compartidos `cu03PasswordValidator` y `optionalCu03PasswordValidator` en `form-validators.ts`; formulario de usuario alineado (`user-form-dialog`).

### 2. Nombres y apellidos de paciente (CU02)

- **Backend:** `PatientCreateRequest` y `PatientUpdateRequest` — `firstName` / `lastName` con `@Size(min=2,max=100)` y `@Pattern` Unicode: al menos una letra (`\p{L}`), solo letras y espacios (`2–100`).
- **Frontend:** `patientPersonNameCu02Validator()` y mensajes de error en el diálogo de paciente.

**Riesgo aceptado:** nombres compuestos con guion, apóstrofe (`D'Angelo`) u otros signos **no** están permitidos por el literal del CU02; esas correcciones pasan a recomendación de fase futura o ajuste normativo.

### 3. Asistencia de personal (CU14)

- **Frontend:** el selector solo usa el catálogo `ATTENDANCE_TYPES` (`PRESENTE`, `AUSENTE`, `PERMISO`, `VACACIONES`), opción `Sin definir` con valor `null` (coherente con asistencia opcional en backend), validador cliente si llegara un valor fuera del catálogo.
- La opción textual confusa `"Predeterminado (PRESENTE)"` con `value=""` se eliminó.

### 4. Prioridad en orden médica (create vs update)

- **Análisis:** el servicio aplicaba **`NORMAL`** si `priority` venía vacío/`null` en **create**, mientras que **update** exigía texto no vacío (`@NotBlank`).
- **Acción elegida:** **sin** hacer obligatorio `priority` en `MedicalOrderCreateRequest` del backend (evita endurecer contrato OpenAPI/implementaciones que omitían el campo).  
- **Frontend:** prioridad **obligatoria** en alta y edición con valor inicial **`NORMAL`**, coincidiendo con el valor por defecto del servicio cuando antes se omitía; el alta envía siempre texto explícito (respaldo `NORMAL` tras `trim`).

---

## Qué no se modificó y por qué

| Tema | Motivo |
|------|--------|
| Base de datos / scripts | Restricción explícita de fase |
| `MedicalOrderCreateRequest.priority` `@NotBlank` en backend | Endurecería contrato formal (campo opcional antes); solo se mejoró UX y envío desde Angular |
| Triage vitales obligatorios, MedicalCare/admisión, citas `@Future`, pagos/seguro auto, farmacia, horarios, CU01 | Fuera de alcance / fases posteriores |
| Reglas financieras adicionales | Restricción explícita |

---

## Archivos modificados

- `backend/src/main/java/com/hospital/user/dto/UserCreateRequest.java`
- `backend/src/main/java/com/hospital/user/dto/UserUpdateRequest.java`
- `backend/src/main/java/com/hospital/patient/dto/PatientCreateRequest.java`
- `backend/src/main/java/com/hospital/patient/dto/PatientUpdateRequest.java`
- `frontend/src/app/features/shared/form-validators.ts`
- `frontend/src/app/features/users/components/user-form-dialog.component.ts`
- `frontend/src/app/features/users/components/user-form-dialog.component.html`
- `frontend/src/app/features/patients/components/patient-form-dialog.component.ts`
- `frontend/src/app/features/patients/components/patient-form-dialog.component.html`
- `frontend/src/app/features/staff/components/staff-form-dialog.component.ts`
- `frontend/src/app/features/staff/components/staff-form-dialog.component.html`
- `frontend/src/app/features/medical-orders/components/medical-order-form-dialog.component.ts`
- `frontend/src/app/features/medical-orders/components/medical-order-form-dialog.component.html`
- `backend/doc/API.md` (notas bajo **Usuarios** y **Órdenes médicas**)

**Contratos de API:** mismos URIs y nombres de propiedades JSON; las respuestas 400 pueden incluir nuevos textos de validación en español donde ya existían anotaciones.

---

## Resultado de pruebas backend

- Comando: `mvn -q clean compile test` (directorio `backend/`)
- **Exit code:** `0` (compilación y tests ejecutados).

---

## Resultado de build frontend

- Comando: `npm run build` (directorio `frontend/`)
- **Exit code:** `0` (`Application bundle generation complete`).

---

## Riesgos pendientes

- **Paciente:** registros legacy o nombres con guiones/apóstrofos podrían requerir revisión antes de un guardado tras esta fase; considerar política de migración o ampliación del patrón con acuerdo de negocio.
- **Usuarios:** integraciones automatizadas que creaban cuentas con contraseña débil fallarán con 400 (comportamiento deseado bajo CU03).
- **Órdenes médicas:** clientes externos que llamen la API sin `priority` en POST siguen recibiendo `NORMAL` en servidor; solo el comportamiento UX del SPA cambió al exigir y enviar prioridad por defecto.
- **Asistencia personal:** valores no catálogo almacenados previamente en BD seguirían leyendo; al editar, el campo puede aparecer como “Sin definir” si no coincide con las opciones (el usuario debe reasignar a un valor válido para actualizar).

---

## Recomendación para la siguiente fase

- **Opción técnica coherente con órdenes:** documentar prioridad opcional/`NORMAL` por defecto en `backend/doc/API.md` si aún no está explicitado, o en una mini-fase hacer obligatorio `priority` en DTO solo si todas las consumidoras están bajo control.
- **Paciente CU02 extendido:** decidir inclusión explícita de `'` `-` `.` si el caso de uso lo permite en Latinoamérica.
- **Contraseña:** MFA/CU03 adicional fuera del alcance 1.3.
- **Pruebas:** añadir pruebas unitarias Angular para los nuevos validadores y, en backend, pruebas de binding de usuarios si se desea cerrar regression.

---

*Entregable Fase 1.3.*
