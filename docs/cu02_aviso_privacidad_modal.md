# CU02 — Aviso de privacidad en formulario de paciente (modal)

**Alcance:** solo experiencia de usuario en **intranet** (Angular). La API sigue exigiendo `privacyAccepted` conforme a `PatientCreateRequest` / `PatientUpdateRequest`.  
**Relación:** amplía el flujo descrito en `docs/casos_de_uso_detallados_corregido.md` (CU02).

## Dónde está el texto legal

- **Cuerpo completo del aviso** (párrafos, listas y secciones numeradas):  
  `frontend/src/app/features/patients/components/privacy-notice-dialog.component.html`  
  Así se facilita el mantenimiento jurídico: se edita como plantilla HTML sin mezclarlo con lógica TypeScript.

## Datos parametrizables del responsable

Nombre del hospital, dirección, teléfono y correo se interpolan desde **`environment.privacyNotice`**:

| Clave | Uso en el aviso |
|-------|-----------------|
| `hospitalName` | Nombre institucional y punto 1 |
| `physicalAddress` | Dirección física completa |
| `phone` | Teléfono |
| `email` | Correo electrónico |

Archivos:

- `frontend/src/environments/environment.development.ts`
- `frontend/src/environments/environment.ts` (producción)

Hasta que se configuren valores reales, pueden mantenerse los **placeholders** entre corchetes del borrador legal.

## Fecha “última actualización”

Se muestra al pie del modal con la **fecha local** al **momento de abrir** el diálogo (`Intl.DateTimeFormat`, `es-GT`). No sustituye un control de versiones del documento legal; si se requiere fecha fija por versión, puede añadirse una clave opcional en `environment` en una iteración posterior.

## Comportamiento UX (resumen)

- El **checkbox** y el **enlace** “Aceptación de privacidad” / “Ver aviso de privacidad” son **vecinos en el DOM**, no etiqueta integrada del checkbox: el clic en el enlace **no** alterna la casilla.
- El enlace abre `PrivacyNoticeDialogComponent` vía `MatDialog`.
- En **alta**, la casilla sigue siendo obligatoria (`Validators.requiredTrue` + `@AssertTrue` en backend).

## Componentes involucrados

| Archivo | Rol |
|---------|-----|
| `patient-form-dialog.component.*` | Fila privacidad + `openPrivacyNotice()` |
| `privacy-notice-dialog.component.*` | Modal de solo lectura + Cerrar |
