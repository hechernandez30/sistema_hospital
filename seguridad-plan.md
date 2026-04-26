# Plan de Seguridad

## Fase S1
- Agregar Spring Security
- Configurar rutas públicas y privadas
- Implementar PasswordEncoder
- Crear endpoint de login

## Fase S2
- Implementar JWT
- Generar token en login
- Validar token en cada request
- Proteger endpoints por rol

## Fase S3
- Manejar errores 401 y 403 (formato `ApiErrorResponse` unificado)
- Registrar eventos de seguridad en bitácora (vía interna: login, accesos denegados, JWT inválido)
- Revisar permisos por módulo (sin cambiar semántica S2 salvo corrección crítica)
- Rutas públicas centralizadas; sesión no usada (`STATELESS` también con API abierta)

## Reglas
- No cambiar entidades funcionales sin justificarlo
- Mantener compatibilidad con frontend futuro