# Fase 7.2.2 — Ajuste visual buscador en header público (CU01)

## Qué se modificó

- **Buscador en header (sin desborde)**:
  - Se eliminó el margen negativo que provocaba que el `mat-form-field` sobresaliera hacia la parte inferior del header.
  - Se reforzó alineación vertical del header con `align-items: center`.
- **Label flotante removido**:
  - Se retiró `mat-label` (“Buscar”) del campo.
  - Se mantuvo **solo** `placeholder="Buscar información pública"` y se agregó `aria-label="Buscar información pública"` para accesibilidad.
- **Estado “Sin resultados” compactado**:
  - Se ajustó tipografía y espaciado del bloque vacío en el dropdown.
  - Título: `0.875rem`, `font-weight: 600`.
  - Texto descriptivo: `0.8125rem`, `font-weight: 400`.
  - Padding: `0.75rem 0.875rem`.
  - `line-height: 1.35` y control de quiebre para evitar desborde horizontal.
- **Ajuste de contención del texto “Sin resultados”**:
  - Se agregó contenedor interno `.panel-empty-text` con `min-width: 0` y `width: 100%`.
  - Se forzó wrapping seguro en el bloque vacío:
    - `white-space: normal`
    - `overflow-wrap: break-word`
    - `word-break: normal`
  - En el panel se reforzó `min-width: 0` y en la tarjeta `overflow: hidden` para evitar escapes visuales.
- **Ajuste de contención de resultados con coincidencias**:
  - Se ajustó ancho del dropdown para resultados: `width: min(420px, calc(100vw - 32px))`.
  - Se habilitó scroll vertical en lista de resultados (`max-height` + `overflow-y: auto`).
  - Se forzó wrapping seguro en tarjetas y textos:
    - `.panel-item`, `.panel-title`, `.panel-desc` con `white-space: normal`, `overflow-wrap: break-word`, `word-break: normal`, `max-width: 100%`.
  - Con esto, nombre/tipo/descripción se mantienen dentro del recuadro sin desbordamiento horizontal.

## Confirmaciones

- **El buscador permanece dentro del header** y ya no se muestra como franja separada.
- **No se desborda** visualmente hacia abajo del header.
- **No aparece** label flotante “Buscar”.
- **Se mantuvo** `aria-label` para accesibilidad.
- **No se cambió** lógica, slugs, rutas, navegación por resultados ni assets usados.
- **No se consume** `/api` desde el portal público.
- El mensaje de “Sin resultados” ya **no se sale del recuadro** y envuelve correctamente en múltiples líneas cuando es necesario.
- Los resultados con coincidencias también quedan contenidos dentro del dropdown y su altura se adapta al contenido.

## Resultado build frontend

- Ejecutado: `npm run build`
- Resultado: **OK** (exit code 0).
- Nota: aparece warning de budget CSS en `public-layout.component.scss` (no bloqueante).

## Alcance CU01

- Se mantiene portal institucional/informativo: **sin** registro público, **sin** reserva/solicitud pública de citas, **sin** pagos/admisiones/órdenes públicas.
- Login de personal: **sin cambios**.
