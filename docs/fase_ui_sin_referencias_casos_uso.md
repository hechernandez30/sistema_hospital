# Ajuste UI — Textos sin referencias a casos de uso

**Fecha:** 2026-05-21  
**Estado:** Implementado

## Objetivo

Eliminar del frontend intranet las menciones visibles a códigos de caso de uso (CUxx), reglas de negocio documentales (RNxx) y flujos alternos (FAxx), sustituyéndolas por lenguaje operativo para el usuario final.

## Alcance

- Solo textos de interfaz (hints, subtítulos, etiquetas, mensajes `snackBar`).
- Sin cambios en backend, validaciones, DTOs ni lógica de negocio.
- Comentarios en código TypeScript/SCSS no modificados (no visibles al cliente).

## Archivos modificados

| Módulo | Archivo |
|--------|---------|
| Admisiones | `admission-form-dialog.component.html` |
| Atenciones | `medical-care-form-dialog.component.html` |
| Órdenes médicas | `medical-order-form-dialog.component.html`, `medical-order-list-page.component.html` |
| Triage | `triage-form-dialog.component.html` |
| Pagos | `payment-form-dialog.component.html`, `payment-form-dialog.component.ts` |
| Personal | `staff-form-dialog.component.html` |
| Laboratorio | `laboratory-form-dialog.component.html`, `laboratory.models.ts`, `laboratory-list-page.component.html` |
| Reportes | `reports-page.component.html` |
| Roles | `role-list-page.component.html` |

## Confirmaciones

| Área | ¿Cambió? |
|------|----------|
| Textos visibles CU/RN/FA | Eliminados o reescritos |
| Reglas y validaciones | No |
| Backend / BD | No |

## Build

Ejecutar `npm run build` tras despliegue local.

---

*Limpieza de copy orientada al usuario final del hospital.*
