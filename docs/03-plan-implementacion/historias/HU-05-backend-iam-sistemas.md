> **Documentacion:** [Indice](../../README.md) | [Plan de implementacion](../README.md) | [Backend Schema](../../02-arquitectura/01-backend-schema.md) | [Database Schema](../../02-arquitectura/02-database-schema.sql)

# HU-05 — Backend real: módulos `accesos` (IAM) y `sistemas`

**Como** administrador del sistema, **quiero** que la gestión de usuarios, roles y
registro de MFEs persista en una base de datos real, **para** que los cambios sobrevivan
a un reinicio y varios administradores compartan el mismo estado.

**Tamaño:** L &nbsp;&nbsp; **Prioridad:** 🟡 Media &nbsp;&nbsp; **Depende de:** HU-04 (reutiliza `shared/security` y el JWT emitido por `auth`)

## Contexto

Segunda mitad de la antigua Fase 7. El contrato de endpoints ya está en
[`01-backend-schema.md` §4](../../02-arquitectura/01-backend-schema.md) y los esquemas
`iam`/`sistemas` en el DDL. El frontend (`accesos.service.ts`, `sistemas.service.ts`) ya
consume exactamente esta forma de datos contra la Fake API — este backend solo tiene que
cumplir el mismo contrato para que el Host no necesite cambios al conectarse (HU-06).

## Alcance

**Sí incluye:** módulos `accesos` (usuarios, roles, permisos) y `sistemas` (registro de
MFEs, estructura jerárquica Sistema → Secciones → Subsecciones → Módulos, permisos por
rol), auditoría básica (`SET LOCAL app.usuario_id` por transacción + bitácora).

**No incluye:** cambios al contrato existente — si algo no encaja, se ajusta el backend
al contrato documentado, no al revés (el frontend ya está construido sobre esa forma).

## Pasos

- [ ] Flyway: esquemas `iam`, `sistemas`, `auditoria` del DDL (`02-database-schema.sql`).
- [ ] Módulo `accesos`: CRUD de usuarios y roles, asignación de sistemas por rol.
- [ ] Módulo `sistemas`: CRUD de sistemas + árbol de secciones/subsecciones/módulos +
      matriz de permisos por rol.
- [ ] Auditoría: interceptor/aspecto que hace `SET LOCAL app.usuario_id` y
      `app.trace_id` por transacción, más bitácora en `auditoria.accesos`.
- [ ] Tests de integración por endpoint del contrato §4.

## Criterios de aceptación

- Cada endpoint de `01-backend-schema.md` §4 devuelve la misma forma de payload que hoy
  simula `fake-db.ts` en el Host (mismos nombres de campo).
- Una acción de creación/edición en `accesos` o `sistemas` deja registro en
  `auditoria.accesos` con el usuario y el trace correctos.

## Archivos afectados

- `mis-backend/src/main/java/pe/confianza/mis/{accesos,sistemas}/**`
- `mis-backend/src/main/resources/db/migration/V1__baseline.sql` (extiende el de HU-04)
