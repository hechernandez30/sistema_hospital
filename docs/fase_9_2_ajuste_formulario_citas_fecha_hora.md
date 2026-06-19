# Fase 9.2 — Ajuste formulario de citas: fecha y hora unificadas (HH:mm)

**Fecha:** 2026-05-21

## Resumen

Se unificó la selección de **hora y minutos** en un solo campo compacto `HH:mm` (`input type="time"`) a la derecha de cada fecha, en el formulario de creación/edición de citas. Solo cambios de **layout y presentación** del control de hora; la lógica de `startAt` / `endAt` se mantiene.

---

## Qué se modificó

| Archivo | Cambio |
|---------|--------|
| `frontend/src/app/features/shared/datetime-local-field.component.ts` | Un solo `timeCtrl` (HH:mm); eliminados selectores separados hora/minuto |
| `frontend/src/app/features/shared/datetime-local-field.component.html` | `input type="time"` dentro de `mat-form-field` |
| `frontend/src/app/features/shared/datetime-local-field.component.scss` | Campo hora compacto; fecha + hora en fila; apilado en móvil estrecho |
| `frontend/src/app/features/appointments/components/appointment-form-dialog.component.scss` | Estilos del diálogo alineados al campo hora único (`.dt-time`) |
| `frontend/src/app/features/appointments/components/appointment-form-dialog.component.html` | Sin cambio estructural (ya usa `app-datetime-local-field` con clase `apt-datetime`) |

## Diseño resultante

| Bloque | Layout escritorio |
|--------|-------------------|
| **Inicio** | `[Fecha inicio]` `[09:00]` |
| **Fin** | `[Fecha fin]` `[09:30]` |

- Formato visual y de valor interno: **HH:mm** (p. ej. `09:00`, `09:30`, `14:15`).
- El valor completo sigue siendo `datetime-local`: `YYYY-MM-DDTHH:mm` → API `startAt` / `endAt` sin cambios.

## Comportamiento conservado

| Funcionalidad | Estado |
|---------------|--------|
| Validación fin > inicio | Sin cambios |
| Botón «Calcular hora fin» (duración especialidad) | Sin cambios; rellena Fin p. ej. `09:30` |
| Prefill desde agenda (hueco horario) | Sin cambios |
| Edición: carga fecha/hora existentes | Sin cambios |
| `datetimeLocalToApi` / `joinDatetimeLocal` / `splitDatetimeLocal` | Sin cambios |

## Confirmaciones

| Área | ¿Modificado? |
|------|----------------|
| Hora + minuto unificados en un campo HH:mm | **Sí** |
| Backend, BD, DTOs, endpoints | **No** |
| Lógica de negocio, solapamiento, agenda/listado | **No** |
| Otros módulos | **No** |

## Build

```bash
npm run build
```

**Resultado:** OK (exit 0).

Warnings previos de presupuesto CSS en `appointment-agenda` y `public-layout` (no introducidos por este ajuste).

## Selector de hora en Chrome / Edge

`mat-form-field` suele ocultar el icono nativo de `input type="time"`. Se añadió:

- Botón **reloj** (`schedule`) que llama a `HTMLInputElement.showPicker()` (mismo patrón que el calendario de fecha).
- Indicador nativo del input oculto para no duplicar iconos; solo el reloj abre el selector.
- Campo hora compacto (~9.25rem).

El usuario puede: clic en el icono de reloj o escribir `HH:mm` en el campo.

---

## Pruebas recomendadas (smoke)

1. **Nueva cita:** Inicio `09:00`, Fin `09:30` → guardar OK.
2. **Editar cita:** fecha y hora cargan correctamente en los controles.
3. **Calcular hora fin:** con especialidad de 30 min, Fin pasa a p. ej. `09:30`.
4. **Validación:** fin ≤ inicio → mensaje de error.
5. **Red:** payload con `startAt` / `endAt` ISO esperado por backend.
6. **Responsive:** escritorio en una fila; móvil sin desbordes.

---

*Documento de cierre del ajuste UI — formulario de citas.*
