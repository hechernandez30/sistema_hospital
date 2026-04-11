# Contexto del proyecto
Este repositorio corresponde a un sistema hospitalario privado.

## Módulos
- roles
- usuarios
- especialidades
- personal
- pacientes
- seguros
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

## Base de datos
La base de datos de referencia está en `hospital_postgresql_15_tablas_es.sql`.

## Reglas de trabajo
- Trabajar por fases
- No generar frontend hasta que se solicite
- No implementar seguridad completa hasta que se solicite
- No cambiar la base de datos sin justificarlo
- Mantener arquitectura por capas
- Generar código compilable
- Usar DTOs para entrada y salida
- Validar datos con Jakarta Validation
- Usar manejo global de excepciones
- Mantener nombres del dominio hospitalario consistentes con el SQL

## Arquitectura requerida
- controller
- service
- repository
- entity
- dto
- exception
- config

## Restricciones
- No usar JWT todavía en la fase inicial
- No generar microservicios
- No agregar Redis, Kafka ni colas
- No agregar Docker salvo que se pida
- No implementar lógica no pedida

## Criterio de ejecución
Antes de escribir código:
1. leer el SQL
2. identificar entidades y relaciones
3. proponer plan
4. esperar aprobación