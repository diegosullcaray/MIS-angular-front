> **Documentacion:** [Indice](../README.md) | [01 PRD](../01-canon/01-prd.md) | [02 UX/App Flow](../01-canon/02-ux-app-flow.md) | [03 TRD](../01-canon/03-trd.md)

# Plan de implementación — Historias de Usuario (HU)

Este es **el documento vivo** de trabajo pendiente del MIS Host. Reemplaza al plan por
fases original (conservado como referencia histórica en
[`00-plan-fases-original.md`](./00-plan-fases-original.md)) porque ese plan asumía un
estado del código que la auditoría de [`00-estado-real.md`](./00-estado-real.md) mostró
que no es exacto: varias tareas marcadas `✅ COMPLETADA` en realidad compiten con código
duplicado y roto, o con rutas que no coinciden entre doc y código.

## Por qué HU y no fases

El plan anterior (`00-plan-fases-original.md`) planificaba en bloques de 6–8 semanas.
Sirvió para construir el frontend contra la Fake API, pero es difícil de retomar "poco a
poco": una fase de varias semanas no dice qué hacer *hoy*. Este plan usa Historias de
Usuario pequeñas (ver tamaño T-shirt en cada una) para poder ejecutar y cerrar una a la
vez, en orden, sin perder la vista de conjunto.

## Cómo leer y escribir una HU

Cada archivo en [`historias/`](./historias/) sigue esta plantilla:

```markdown
# HU-XX — Título corto

**Como** <rol>, **quiero** <capacidad>, **para** <beneficio>.

**Tamaño:** S / M / L    **Prioridad:** 🔴 Bloqueante / 🟠 Alta / 🟡 Media
**Depende de:** HU-YY (si aplica)

## Contexto
(1–2 párrafos: por qué existe esta HU, qué evidencia la motiva — enlazar a 00-estado-real.md si aplica)

## Alcance
- Qué sí incluye
- Qué NO incluye (explícito, para no volver a forkear en vez de resolver)

## Pasos
- [ ] Paso ejecutable con archivo(s) concreto(s)

## Criterios de aceptación
- Dado ... cuando ... entonces ...

## Archivos afectados
- `ruta/al/archivo.ts`
```

### Restricciones globales (aplican a toda HU)

Heredadas del análisis del sistema anterior y adaptadas al stack nuevo — la lección
central de esa auditoría fue que la deuda no vino de mala arquitectura sino de un
*proceso* que premiaba copiar sobre reusar (ver
[`../06-legado-sistema-anterior/01-analisis/01-arquitectura.md §9`](../06-legado-sistema-anterior/01-analisis/01-arquitectura.md#9-lectura-final-de-la-arquitectura)):

| Regla | Motivo |
|---|---|
| Ningún componente/servicio nuevo sin `.spec.ts` | El legado llegó a 122k LOC con 28 specs; aquí se empieza en 0 — no repetir el patrón |
| Ningún `any` nuevo (`strict: true` ya está activo) | A diferencia del legado, el tipado nunca se apagó — no reintroducirlo |
| Antes de crear un componente/servicio, buscar si ya existe uno equivalente | Causa raíz de `admin/` vs `accesos`+`sistemas` (HU-00) |
| Un módulo de `pages/modules/` no importa componentes de otro módulo (TRD §5.1) | Regla de aislamiento ya definida; verificar que se respeta al tocar cada HU |
| Commits atómicos por HU, mensaje convencional (`fix:`, `feat:`, `docs:`, `test:`) | Trazabilidad — cada HU cerrada debe verse en un commit o PR, no mezclada con otras |
| Nunca eliminar código sin verificar uso (buscar referencias primero) | Evita borrar por error algo que sí esté enrutado |
| Actualizar `00-estado-real.md` cuando una HU cierre un hallazgo que documenta | El canon no debe quedar desactualizado como le pasó al plan por fases |

## Backlog, en orden

El orden **no es por número de fase, es por dependencia real**: primero estabilizar lo
que ya existe, después completar lo que falta.

| HU | Título | Tamaño | Por qué en este orden | Estado |
|---|---|---|---|---|
| [HU-00](./historias/HU-00-estabilizacion-admin-duplicado.md) | Eliminar el módulo `admin/` duplicado y enrutar `accesos/` + `sistemas/` | M | Deuda ya acumulada — bloquea confiar en cualquier ruta de gestión | ✅ Cerrada 2026-07-26 |
| [HU-01](./historias/HU-01-red-de-seguridad-tests.md) | Primeros tests de caracterización | S | 0 specs hoy; sin red de seguridad no se puede tocar nada (HU-00 incluido) con confianza | ✅ Cerrada 2026-07-26 |
| [HU-02](./historias/HU-02-alinear-rutas-admin-vs-inicio.md) | Decidir y alinear el prefijo de rutas (`/admin` doc vs `/inicio` código) | S | Bloquea que la doc 02 y el código dejen de contradecirse; afecta a toda HU que use rutas de ejemplo | ✅ Cerrada junto con HU-00 |
| [HU-03](./historias/HU-03-dockerizacion.md) | Dockerización del Host | M | Prerrequisito de desplegar el Host de forma independiente de cualquier Remote | ⏳ Pendiente |
| [HU-04](./historias/HU-04-backend-auth.md) | Backend real — módulo `auth` (login + OTP + JWT) | L | Primer módulo backend real; desbloquea retirar la Fake API en autenticación | ⏳ Pendiente |
| [HU-05](./historias/HU-05-backend-iam-sistemas.md) | Backend real — módulos `usuarios`, `roles` y `sistemas` | L | Completa el backend real del Host | ⏳ Pendiente |
| [HU-06](./historias/HU-06-conectar-backend-real.md) | Conectar el Host al backend real y retirar `fakeApiInterceptor` | M | Cierre del backend real | ⏳ Pendiente |
| [HU-07](./historias/HU-07-primer-sistema-hijo.md) | Primer sistema hijo real (`mis-remote-reportes`) end-to-end | L | Valida CA-01..CA-05 con un Remote real, no con la Fake API | ⏳ Pendiente |

Detalle de cierre de HU-00/HU-01/HU-02 en
[`../04-bitacora/2026-07-26-hu00-hu01-ejecucion.md`](../04-bitacora/2026-07-26-hu00-hu01-ejecucion.md).
Próximo paso sugerido: **HU-03** (Dockerización) o adelantar **HU-04** (backend `auth`) si
hay equipo backend disponible en paralelo.

## Plan anterior (por fases)

`00-plan-fases-original.md` queda como referencia histórica: documenta cómo se construyó
el frontend actual (Fases 0–5) y sirve para entender decisiones ya tomadas (por ejemplo,
por qué el layout vive en `pages/full-pages/layout/` y no en `core/layout/` como decía el
plan v1). No se le agregan tareas nuevas — el trabajo pendiente vive exclusivamente en el
backlog de HU de arriba.
