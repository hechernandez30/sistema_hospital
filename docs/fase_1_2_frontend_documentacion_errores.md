# Fase 1.2 — Documentación y visualización de errores en frontend

**Fecha de cierre:** 5 de mayo de 2026  
**Objetivo:** Alinear documentación técnica con el contrato de errores en español del backend y mejorar la muestra de **`message`** y **`fieldErrors`** en la intranet Angular, sin cambiar reglas de negocio ni contratos de API.

---

## Archivos revisados

| Área | Archivo(s) |
|------|------------|
| Contrato de error en cliente | `frontend/src/app/core/models/api-error-response.model.ts` |
| Extracción de mensaje + snackbars | `frontend/src/app/core/utils/http-error-message.ts` |
| Login público (CU01 sin cambios de alcance) | `frontend/src/app/public/pages/login/login.component.ts` |
| Interceptor JWT | `frontend/src/app/core/interceptors/auth.interceptor.ts` (solo lectura: no redirige por 401 global) |
| Uso de errores en módulos | Múltiples `*form-dialog*.ts`, `*-list-page*.ts` que llaman `getHttpErrorMessage` (sin cambios puntuales necesarios tras el helper central) |
| Documentación API | `backend/doc/API.md` |
| Auditoría Fase 1 | `docs/fase_1_auditoria_reglas_transversales.md` (nota §9) |
| README raíz / frontend | `README.md`, `frontend/README.md` |

---

## Archivos modificados

- `backend/doc/API.md` — sección *Errores* ampliada: tabla de campos, ejemplos JSON en español, referencia al helper del frontend.
- `docs/fase_1_auditoria_reglas_transversales.md` — §9 nota de cierre Fase 1.1 / 1.2.
- `README.md` — enlace a documentación de errores.
- `frontend/README.md` — breve descripción de manejo de errores HTTP.
- `frontend/src/app/core/utils/http-error-message.ts` — preferir `message` del cuerpo en **401**, **403**, **404** y **409**; anexar resumen de **`fieldErrors`**; utilidad `parseApiErrorResponse`; compatibilidad con mensajes legacy en inglés vía `translateKnownMessage`.
- `frontend/src/app/public/pages/login/login.component.ts` — uso de `getHttpErrorMessage` en lugar de lectura manual solo de `message`.

**Código backend:** no modificado.  
**DTOs / servicios backend:** no modificados.  
**CU01:** portal público solo informativo; login en `/p/acceso` sigue siendo la vía de entrada a la intranet sin nuevas funciones públicas.

---

## Documentación actualizada

| Documento | Cambio |
|-----------|--------|
| `backend/doc/API.md` | Textos 401/403 alineados con `RestAuthenticationEntryPoint` / `RestAccessDeniedHandler`; ejemplos 400 (validación + `fieldErrors`), 400 negocio, 404, 401, 403. |
| `docs/fase_1_auditoria_reglas_transversales.md` | §9: contexto posterior a 1.1/1.2. |
| `README.md` | Puntero a `backend/doc/API.md` → Errores. |
| `frontend/README.md` | Descripción de snackbars y helper. |

---

## Cómo maneja Angular los errores actualmente

1. **Cliente HTTP:** `HttpClient` devuelve `HttpErrorResponse` con `error` parseado como objeto si la API responde `application/json`.
2. **Sin interceptor global de errores:** cada `subscribe({ error })` o `catchError` en componentes/servicios gestiona el fallo; el patrón habitual es `MatSnackBar.open(getHttpErrorMessage(err, '…'), …)`.
3. **Autenticación:** `authInterceptor` añade `Authorization: Bearer …` a `/api/**` excepto login; no fuerza logout ante 401 automáticamente (el usuario ve el mensaje en snackbar o en pantalla de carga según el componente).
4. **Modelo:** `ApiErrorResponse` incluye `fieldErrors?: { field; message }[]` acorde al backend.

---

## Ajustes realizados (resumen técnico)

- **401 / 403 / 404 / 409:** si el cuerpo incluye `ApiErrorResponse.message`, se muestra **primero** ese texto (traduciendo solo equivalencias legacy conocidas en inglés); si falta, se mantiene el fallback en español anterior.
- **Validación 400:** el mensaje raíz del backend (p. ej. `"Error de validación"`) se muestra y se añade un fragmento con hasta **8** pares `campo: mensaje`, usando el segmento tras el último `.` en `field` para legibilidad en una sola línea de snackbar.
- **Login:** mismo criterio que el resto de la app para consistencia con JWT inválido/expirado (`Token inválido o expirado`) y credenciales incorrectas.

---

## Confirmación de alcance

- **Reglas funcionales:** sin cambios en flujos, validaciones Angular adicionales ni lógica de negocio en servidor.
- **Contratos de API:** sin cambios de rutas, códigos nuevos o renombrado de campos JSON.
- **Seguridad / roles:** sin modificaciones.
- **CU01:** sin registro/reserva pública nueva.

---

## Resultado de build frontend

Comando: `npm run build` (desde `frontend/`), 5 de mayo de 2026.

- **Exit code:** `0`
- **Salida:** `Application bundle generation complete` (~10 s), artefactos en `frontend/dist/hospital-web`.

---

## Resultado de backend

No se ejecutó compilación Maven: **no hubo cambios en código Java**.

---

## Revisión práctica (referencia para smoke manual)

| Caso | Comportamiento esperado en UI |
|------|-------------------------------|
| Validación con `fieldErrors` | Snackbar: mensaje raíz + fragmento `campo: mensaje · …` |
| Error de negocio (400 sin `fieldErrors`) | Snackbar: texto de `message` del backend |
| 401 | Mensaje del cuerpo si existe (p. ej. token); si no, fallback de sesión |
| 403 | Mensaje del cuerpo (`Acceso denegado`) o fallback de permisos |

*(La verificación en vivo depende de tener API + intranet en ejecución; los tests automatizados del frontend no fueron ampliados en esta fase.)*

---

## Pendientes sugeridos (Fase 2 o Fase 1.3)

- **Interceptor 401 global:** opcionalmente cerrar sesión y redirigir a `/p/acceso` con `returnUrl` (decisión UX/seguridad; no implementado para no alterar comportamiento actual sin aprobación explícita).
- **Formularios:** mapear `fieldErrors` a `FormControl`/`setErrors` por nombre de campo (mejor que solo snackbar) donde el path del backend coincida de forma estable con el formulario.
- **i18n Angular:** si en el futuro se bilingüúa la UI, externalizar strings de fallback del helper.
- **Pruebas unitarias:** tests del helper `getHttpErrorMessage` con `HttpErrorResponse` de ejemplo (401/403/400 con `fieldErrors`).
- **Temas excluidos por mandato de fase:** política de contraseña, triage obligatorio, citas, pagos/seguro automático, stock — sin avance en esta entrega.

---

*Entregable Fase 1.2 — documentación y visualización de errores en frontend.*
