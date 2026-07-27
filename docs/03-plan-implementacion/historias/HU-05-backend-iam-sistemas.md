> **Documentacion:** [Indice](../../README.md) | [Plan de implementacion](../README.md) | [Backend Schema](../../02-arquitectura/01-backend-schema.md) | [Database Schema](../../02-arquitectura/02-database-schema.sql)

# HU-05 — Backend real: módulos `usuarios`, `roles` y `sistemas`

**Como** administrador del sistema, **quiero** que la gestión de usuarios, roles y
registro de MFEs persista en una base de datos real, **para** que los cambios sobrevivan
a un reinicio y varios administradores compartan el mismo estado.

**Tamaño:** L &nbsp;&nbsp; **Prioridad:** 🟡 Media &nbsp;&nbsp; **Depende de:** HU-04 (reutiliza `shared/security` y el JWT emitido por `auth`)

## Contexto

Segunda mitad de la antigua Fase 7. El contrato de endpoints ya está en
[`01-backend-schema.md` §4](../../02-arquitectura/01-backend-schema.md) y el esquema
`iam`/`sistemas` en el DDL. El frontend consume exactamente esta forma de datos contra la
Fake API desde 3 servicios independientes (`admin/usuarios/services/usuarios.service.ts`,
`admin/roles/services/roles.service.ts`, `admin/sistemas/services/sistemas.service.ts` —
ver [`04-bitacora/2026-07-26-submodulos-admin.md`](../../04-bitacora/2026-07-26-submodulos-admin.md)
para el porqué de la división). El backend adopta la misma paridad 1:1
(`01-backend-schema.md` v2.1.0 §2): el antiguo bounded context único `accesos` se
reemplaza por dos módulos Java independientes, `usuarios` y `roles`, que comparten el
esquema de BD `iam` pero viven en paquetes separados con su propio controller, service y
repositorio — este backend solo tiene que cumplir el mismo contrato de endpoints para que
el Host no necesite cambios al conectarse (HU-06).

## Alcance

**Sí incluye:** 3 módulos backend independientes —
`usuarios` (CRUD de cuentas, activar/desactivar), `roles` (CRUD de roles, asignación de
sistemas y permisos por rol, consulta de usuarios por rol) y `sistemas` (registro de
MFEs, estructura jerárquica Sistema → Secciones → Subsecciones → Módulos, permisos por
rol) — más auditoría básica (`SET LOCAL app.usuario_id` por transacción + bitácora).

**No incluye:** cambios al contrato existente — si algo no encaja, se ajusta el backend
al contrato documentado, no al revés (el frontend ya está construido sobre esa forma). Ni
dividir el esquema de BD `iam` en dos (queda compartido por `usuarios` y `roles`, ver
`02-database-schema.sql` v2.1.0).

## Pasos

- [ ] Flyway: esquemas `iam`, `sistemas`, `auditoria` del DDL (`02-database-schema.sql`).
- [ ] Módulo `usuarios`: CRUD de usuarios, activar/desactivar cuenta; expone
      `obtenerUsuariosPorRol` en su capa `application/` para que `roles` la consuma.
- [ ] Módulo `roles`: CRUD de roles, asignación de sistemas por rol, matriz de permisos
      por rol; consume `usuarios.application.UsuarioService` y
      `sistemas.application.SistemaService` — nunca sus repositorios (BE-01).
- [ ] Módulo `sistemas`: CRUD de sistemas + árbol de secciones/subsecciones/módulos +
      matriz de permisos por rol.
- [ ] Auditoría: interceptor/aspecto que hace `SET LOCAL app.usuario_id` y
      `app.trace_id` por transacción, más bitácora en `auditoria.accesos`.
- [ ] Tests de integración por endpoint del contrato §4 (incluye ArchUnit verificando que
      `usuarios`/`roles`/`sistemas` no se importan entre sí salvo vía `application/`).

## Criterios de aceptación

- Cada endpoint de `01-backend-schema.md` §4 devuelve la misma forma de payload que hoy
  simula `fake-db.ts` en el Host (mismos nombres de campo).
- Una acción de creación/edición en `usuarios`, `roles` o `sistemas` deja registro en
  `auditoria.accesos` con el usuario y el trace correctos.
- Ningún módulo importa `domain/` ni `infrastructure/` de otro módulo (verificado con
  ArchUnit) — solo `application/`, y solo en los cruces documentados en
  `01-backend-schema.md` §2.

## Archivos afectados

- `mis-backend/src/main/java/pe/confianza/mis/{usuarios,roles,sistemas}/**`
- `mis-backend/src/main/resources/db/migration/V1__baseline.sql` (extiende el de HU-04)
