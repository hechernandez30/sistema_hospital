# Sistema Hospitalario Privado

Backend para un sistema hospitalario privado basado en PostgreSQL y casos de uso definidos para:
- usuarios y roles
- personal y especialidades
- pacientes y seguros
- citas
- admisiones
- triage
- atenciones médicas
- órdenes médicas
- laboratorio
- imágenes
- medicamentos
- pagos
- bitácora

## Objetivo
Construir una API REST mantenible, por fases, con seguridad y frontend separados en planes posteriores.

## Stack objetivo
- Java 21
- Spring Boot
- Spring Data JPA
- PostgreSQL
- Maven

## Base de datos
El modelo base está en:
- `hospital_postgresql_15_tablas_es.sql`

## API y errores
Formato unificado de errores (`ApiErrorResponse`), ejemplos y textos **401** / **403** / validación en español: **`backend/doc/API.md`** (sección *Errores*).

## Estrategia de trabajo con agente
1. Analizar contexto
2. Crear plan
3. Ejecutar por fases
4. Revisar compilación
5. Probar endpoints
6. Agregar seguridad
7. Construir frontend
