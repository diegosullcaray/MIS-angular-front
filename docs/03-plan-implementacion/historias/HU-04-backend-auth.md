> **Documentacion:** [Indice](../../README.md) | [Plan de implementacion](../README.md) | [Backend Schema](../../02-arquitectura/01-backend-schema.md) | [Database Schema](../../02-arquitectura/02-database-schema.sql)

# HU-04 — Backend real: módulo `auth` (login + OTP + JWT)

**Como** usuario del Host, **quiero** autenticarme contra un backend real (no la Fake
API), **para** que el login con MFA sea funcional en producción.

**Tamaño:** L &nbsp;&nbsp; **Prioridad:** 🟡 Media &nbsp;&nbsp; **Depende de:** ninguna (puede arrancar en paralelo con HU-00..03)

## Contexto

Corresponde a la antigua Fase 7 del plan por fases, acotada solo al módulo `auth` (la
Fase 7 original mezclaba `auth`, `accesos` y `sistemas` en una sola tarea de varias
semanas — se separa en HU-04 y HU-05 para poder cerrar y validar una cosa a la vez). La
especificación completa del contrato ya existe en
[`01-backend-schema.md`](../../02-arquitectura/01-backend-schema.md) y el DDL en
[`02-database-schema.sql`](../../02-arquitectura/02-database-schema.sql) — esta HU
implementa lo ya diseñado, no diseña de nuevo.

## Alcance

**Sí incluye:** scaffold del proyecto `mis-backend` (Java 21 / Spring Boot 3.3), el
esquema `auth` de la base de datos (Flyway `V1__baseline.sql`), y los endpoints de login
+ verificación OTP + emisión de JWT descritos en el contrato `/api/v1`.

**No incluye:** los módulos `accesos` ni `sistemas` (HU-05), ni retirar la
`fakeApiInterceptor` del Host (HU-06 — primero el backend debe existir y probarse
aislado, por ejemplo con Postman/curl o tests de integración).

## Pasos

- [ ] Scaffold `mis-backend`: módulos `shared` (config, security, web), `auth`.
- [ ] Flyway `V1__baseline.sql` = esquema `auth` de `02-database-schema.sql` (sesiones,
      intentos OTP).
- [ ] Endpoint `POST /api/v1/auth/login`: valida credenciales, genera desafío OTP (TTL 3
      min).
- [ ] Endpoint `POST /api/v1/auth/verificar-otp`: valida OTP (máx. 5 intentos, lockout),
      emite JWT con `jti` persistido en `auth.sesiones`.
- [ ] Tests de integración de ambos endpoints (casos éxito, OTP expirado, lockout).

## Criterios de aceptación

- Dado un usuario válido, cuando hace `POST /auth/login` con credenciales correctas,
  entonces recibe un desafío `{mfaToken, email}` sin sesión aún activa.
- Dado un desafío OTP vigente, cuando se envía el código correcto dentro del TTL,
  entonces se recibe `{token, usuario}` y el JWT tiene `jti` registrado en
  `auth.sesiones`.
- Dado 5 intentos fallidos de OTP, cuando se intenta un sexto, entonces la cuenta queda
  bloqueada según la regla de lockout del contrato.

## Archivos afectados

- Nuevo repo/carpeta: `mis-backend/src/main/java/pe/confianza/mis/{shared,auth}/**`
- Nuevo: `mis-backend/src/main/resources/db/migration/V1__baseline.sql`
