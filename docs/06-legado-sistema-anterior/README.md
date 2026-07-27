# Documentación técnica — `stg-app-mis-r22`

Análisis de arquitectura, deuda técnica y plan de refactorización.

**Fecha del análisis:** 2026-07-24
**Commit base:** `f34f81f`
**Alcance:** 1.707 archivos en `src/` (941 `.ts`, 373 `.scss`, 277 `.html`) ≈ **122.000 líneas**

---

## Estructura de la carpeta

```
doc/
├── README.md            este índice
├── 01-analisis/          el canon: qué es el sistema, qué está mal, qué hacer. Se escribe una vez, cambia poco.
├── 02-bitacora/          registro de ejecución: inventarios, decisiones tomadas, estado de avance. Crece con cada sesión.
├── 03-referencia/        volcados de datos crudos (métricas, salidas de lint/grep) que no se leen de corrido.
└── 04-componentes/       diseño de API de componentes compartidos, escrito antes de tocar código (ej. la tabla unificada).
```

## Índice

### `01-analisis/` — el canon

| Documento | Contenido |
|---|---|
| [`01-arquitectura.md`](./01-analisis/01-arquitectura.md) | Qué es el sistema, contexto de negocio, capas, el protocolo Winder/Ant, flujo de autenticación y navegación |
| [`02-analisis-refactorizacion.md`](./01-analisis/02-analisis-refactorizacion.md) | 24 hallazgos priorizados con evidencia (H-01..H-24): bugs, seguridad, duplicación, escalabilidad |
| [`03-plan-refactorizacion.md`](./01-analisis/03-plan-refactorizacion.md) | Plan de proyecto en 6 fases, con tareas ejecutables y criterios de aceptación — **fuente de verdad del plan** |

### `02-bitacora/` — ejecución

| Documento | Contenido |
|---|---|
| [`04-inventario-routeguard.md`](./02-bitacora/04-inventario-routeguard.md) | Tarea 0.5 — inventario de las 21 rutas y **por qué está bloqueada** |
| [`05-selectores-duplicados.md`](./02-bitacora/05-selectores-duplicados.md) | Tarea 1.2 — los 14 selectores duplicados y su resolución |
| [`06-defectos-detectados.md`](./02-bitacora/06-defectos-detectados.md) | Defectos congelados por tests de caracterización (D-01..D-05), a la espera de decisión de negocio |
| [`07-todos-pendientes.md`](./02-bitacora/07-todos-pendientes.md) | TODO/FIXME convertidos en tickets documentados (Tarea 1.5) |
| [`08-fase1-fase2.md`](./02-bitacora/08-fase1-fase2.md) | Bitácora diff-por-diff: qué se eliminó/movió al cerrar Fase 1 y arrancar Fase 2, con el commit exacto de cada cambio |
| [`09-estado-refactorizacion.md`](./02-bitacora/09-estado-refactorizacion.md) | Vista consolidada de lectura rápida: qué se elimina, qué se mueve, qué sigue — para retomar entre sesiones sin releer todo |
| [`10-checkpoint-tarea23.md`](./02-bitacora/10-checkpoint-tarea23.md) | Checkpoint de Tarea 2.3: inventario de 82 consumidores hecho, diseño escrito, **pendiente de confirmación del usuario** sobre un pivote de arquitectura antes de tocar código |
| [`11-inventario-ngmodules.md`](./02-bitacora/11-inventario-ngmodules.md) | Tarea 2.6 (H-16), Paso 1 — inventario y clasificación de los 331 NgModules (routing/un solo componente/agrupadores), con el hallazgo de ~34 wrappers de indirección de ruteo con imports muertos |

### `03-referencia/` — volcados crudos

| Documento | Contenido |
|---|---|
| [`metricas.md`](./03-referencia/metricas.md) | Indicadores medidos al cierre de cada fase |
| [`baseline-eslint.txt`](./03-referencia/baseline-eslint.txt) · [`selectores.txt`](./03-referencia/selectores.txt) | Volcados de referencia (salida cruda de ESLint y del script de selectores duplicados) |

### `04-componentes/` — diseño de API antes de escribir código

| Documento | Contenido |
|---|---|
| [`stg-table.md`](./04-componentes/stg-table.md) | Tarea 2.3 (H-06) — **cerrada**. Inventario de los 82 consumidores reales de `stg-table`/2/3, diseño de la tabla unificada (extendiendo `stg-table2`, no `stg-table3` como decía el plan), migración de los 22 consumidores de v1 y borrado final de `stg-table` v1 + `stg-table3` |

### `incentivos-auditoria.md` — bloqueado en respuesta de negocio

| Documento | Contenido |
|---|---|
| [`incentivos-auditoria.md`](./incentivos-auditoria.md) | Tarea 2.4 (H-08) — auditoría técnica de `incentivos3`/`4`/`-a` (estructura, modelo de campaña, de dónde sale el cálculo real, código muerto). **Incompleta a propósito**: el plan exige respuestas de negocio (perfiles de usuario, campaña vigente, fecha de retiro) antes de tocar código; esas 5 preguntas quedan explícitas al final del documento, sin responder |

---

## Estado

| Fase | Estado |
|---|---|
| **0 — Estabilizar y medir** | ✅ Tareas 0.1–0.4 cerradas · ⏸️ 0.5 bloqueada (necesita datos de backend) |
| **1 — Higiene y red de seguridad** | ✅ **Cerrada** (1.1 ESLint, 1.2 selectores, 1.3 tests de caracterización, 1.4 `LoggerService`, 1.5 código comentado — incluyó `reportes/legacy`) |
| **2 — Consolidar duplicados** | 🔄 **En curso.** 2.1 (H-07, `ModReportesEService`) ✅ · 2.2+2.3 (H-06 completo, tabla unificada sobre `stg-table2`) ✅ · 2.4 (H-08, familia `incentivos`) **bloqueada en respuesta de negocio** (ver `incentivos-auditoria.md`) · 2.5 (Kaypacha) sin empezar · 2.6 (H-16, NgModules) 🔄 **Paso 1 cerrado**, Paso 2 en curso (32 wrappers de ruteo limpiados, ver `11-inventario-ngmodules.md`) |
| **3–5, X** | Pendientes |

Ver [`02-bitacora/09-estado-refactorizacion.md`](./02-bitacora/09-estado-refactorizacion.md) para el detalle de qué se eliminó, qué se movió y cuál es el próximo paso concreto.

---

## Resumen ejecutivo

`stg-app-mis-r22` es el **MIS (Management Information System)** de Financiera Confianza: un portal Angular 14 que agrupa ~20 módulos de negocio (reportería comercial, incentivos de fuerza de ventas, presupuesto, corresponsales, prospección, ESG) sobre un backend propietario accedido vía un protocolo interno llamado **Winder**.

### El diagnóstico en una frase

> La arquitectura *base* es sólida y deliberada — hay una separación de capas real, una librería de componentes propia y un menú dirigido por datos — pero la **estrategia de evolución ha sido "copiar y versionar"** en lugar de "parametrizar y reusar", y eso multiplicó el código sin multiplicar la capacidad.

### Señales duras

| Métrica | Valor | Lectura |
|---|---|---|
| LOC totales | ~122.000 | — |
| LOC en `modules/reportes` | 75.058 (**62%**) | Un solo módulo es dos tercios del sistema |
| NgModules | **339** | Más módulos (339) que componentes (302) |
| Componentes | 302 | — |
| Archivos `.spec.ts` | **28** | ~9% de cobertura estructural |
| Componentes `standalone` | **0** | Sin migración a Angular moderno |
| `ChangeDetectionStrategy.OnPush` | **1** | 301 componentes en detección por defecto |
| Ocurrencias de `: any` | **3.014** | Tipado efectivamente desactivado |
| `.subscribe(` | 671 | contra 52 archivos con `takeUntil` |
| `console.log` en producción | 671 | Sin capa de logging |
| Familias duplicadas | `incentivos2/3/4/-a`, `Kaypacha/2/3`, `reportes/-e`, `stg-table/2/3/4` | Forks vivos en paralelo |

### Los 5 problemas que hay que atacar primero

1. 🔴 **`WinderService` es un singleton con estado mutable y fuga de `FormData`** — tras cualquier subida de archivo, **todas** las peticiones POST siguientes del sistema entero se corrompen. ([H-01](./01-analisis/02-analisis-refactorizacion.md#h-01))
2. 🔴 **`ng build` genera un bundle de desarrollo** — `"defaultConfiguration": ""` en `angular.json`. Sin minificar, sin optimizar, con *source maps*. ([H-02](./01-analisis/02-analisis-refactorizacion.md#h-02))
3. 🔴 **La autorización de rutas acumula permisos entre usuarios** — `routesArray` nunca se limpia; con la función de suplantación (*alt user*) los permisos se suman. ([H-03](./01-analisis/02-analisis-refactorizacion.md#h-03))
4. 🔴 **7 claves AES incrustadas en el código cliente** + IV en cero + validación de expiración de token comentada. ([H-04](./01-analisis/02-analisis-refactorizacion.md#h-04), [H-05](./01-analisis/02-analisis-refactorizacion.md#h-05))
5. 🟠 **`reportes` es un monolito de 75k LOC** con un `legacy/` de 27k que nadie retira. ([H-09](./01-analisis/02-analisis-refactorizacion.md#h-09))

### Hacia dónde apunta el plan

El objetivo declarado por el negocio es que el proyecto sea **más ordenado, escalable y dinámico**. El plan traduce eso a tres movimientos concretos:

- **Ordenado** → una sola familia de componentes de tabla, un solo servicio de acceso por dominio, borrado de `legacy/`, capas con fronteras verificadas por lint.
- **Escalable** → `strict: true` por incrementos, `OnPush`, componentes `standalone`, presupuestos de bundle reales, tests en la lógica de negocio.
- **Dinámico** → llevar el patrón `*.util.ts` (configuración declarativa) a un **motor de pantallas tipado** y hacer que las **rutas se generen desde el menú del backend**, no desde un array estático en `app-routing.module.ts`.

> ⚠️ **Nota de seguridad:** este análisis identifica credenciales incrustadas en el repositorio. Ver [H-04](./01-analisis/02-analisis-refactorizacion.md#h-04) — requiere rotación de claves en backend, no solo un cambio de código.
