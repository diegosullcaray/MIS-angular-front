# Bitácora — cierre de Fase 1 y arranque de Fase 2

> Registro detallado de qué se eliminó, qué se movió y por qué, sesión del 2026-07-25 en adelante.
> Complementa el estado resumido de `doc/01-analisis/03-plan-refactorizacion.md`. Cada entrada referencia el
> commit exacto en `refactor/fase-1-higiene` para poder revisar el diff real.

---

## Cierre de Tarea 1.5 (H-22) — código muerto comentado

### Commit `716918b` — reportes/legacy (59 archivos)

Ya estaban modificados sin commitear al empezar la sesión (trabajo previo interrumpido). Se
revisó diff por diff antes de commitear:
- Se eliminaron bloques `/* ... */` y `//` con configuraciones descartadas, imports muertos,
  `console.log`/`printLog` de depuración y alternativas comentadas (`jerar:`, `module:`, rutas
  antiguas) en ~58 archivos bajo `reportes/legacy/comercial/rda`, `rma`, `support/`.
- **No se tocó** el bloque comentado de `RevaComponent` en `rda-sectorista(-routing).module.ts`
  (defecto congelado D-01) ni el bloque comentado de `report-crs-v6.component.ts` (D-02, línea
  ~206) — ambos documentados en `doc/02-bitacora/06-defectos-detectados.md`, decisión de negocio pendiente.
- Archivo más grande tocado: `cra-map.ts` (182 líneas, todo config de reportes descartada).

### Commit `34411e9` — relectura completa, 7 archivos sueltos

La relectura del repo (heurística: comentarios que parecen código, fuera de los lotes ya
limpiados) encontró restos en archivos que los barridos anteriores no cubrieron:
- `incentivos3.service.ts`: 2 líneas (`let is_admin`, `let cod_bt`) comentadas, sin uso.
- `rep01-movimiento-clientes.component.ts` y `esg.component.ts`: `//activeHier: boolean;` muerto.
  (De paso quedó registrado, sin corregir por estar fuera de alcance: `esg.component.ts` tiene
  `mainTitle = "Movimiento de Clientes"` — título copiado por error de otro componente. Bug de
  negocio, no código muerto; no se tocó.)
- `mon-imr/detalle-dialog-wrapper.component.ts`: `//dialogConfig.disableClose = true;`.
- `date.service.ts` (legacy): `//var fecL=Moments('20200306');`, alternativa descartada.
- `report-cra-v8.module.ts` / `.component.ts` (legacy): import muerto de `ngx-pagination`,
  `//console.log`.

### Commit `ed3ab89` — últimos 2 archivos

- `storage.service.ts` (legacy): bloque `/* ... */` completo con la implementación vieja de
  `clearAll()` (usaba `console.log` y borrado selectivo por key; la versión activa ya solo hace
  `localStorage.clear()`).
- `token.service.ts`: `//dtk.te = ct + 1000 * 60 * 5;`, fórmula de expiración descartada (la
  activa usa 4 horas).

**Con esto, Fase 1 queda cerrada.** `npm run build` + suite completa (113/113) verificados
después de cada uno de los 3 commits.

---

## Fase 2 — componentes/módulos huérfanos

### Commit `433c067` — 6 huérfanos eliminados (45 archivos, 2.928 líneas)

Detección: script ad-hoc (no commiteado, vivió en el scratchpad de la sesión) que extrae todas
las clases exportadas fuera de `reportes/legacy` y cuenta referencias `\bNombreClase\b` en todo
`src/app` (incluida `legacy`, para no borrar algo que legacy todavía usa). 554 clases analizadas,
7 candidatas con 0 referencias externas (1 descartada por falso positivo: `AppModule`, que se
bootstrapea desde `main.ts`, fuera del árbol analizado).

Confirmado a mano (grep manual sin restricción de carpeta) antes de borrar:

| Eliminado | Qué era | Por qué está seguro |
|---|---|---|
| `core/screen/base/chart-options-manager.ts` | Clase base `ChartOptionsManager` | Nunca se extiende en ningún archivo |
| `core/screen/services/fa-icon.service.ts` | `FaIconService` | Nunca se inyecta en ningún constructor |
| `modules/incentivos2/` completo (24 archivos) | `Incentivos2Module` y toda la generación 2 de incentivos | Confirma H-08 ("sin ruta activa"): además de no tener ruta, el módulo nunca se importa desde ningún otro archivo |
| `modules/Kaypacha2/ranking/` | `RankingComponent` | No declarado en ningún NgModule |
| `modules/reportes/organizacion/actividad-mensual/comitecre/` | `Rep01comitecreModule` | Nunca importado; el archivo de rutas tenía un typo en el nombre (`rep01-comitecre-routing.modulet.ts`, con "t" de más) que confirma que nunca se terminó de integrar |
| `modules/reportes/repositorio/desempeno-social/` | `Rep01DesempenoSocialModule` | Nunca importado desde ningún otro módulo |

---

## Fase 2 — H-07: unificar `ModReportesEService`

### Commit `b2a10f8` — Tarea 2.1 del plan

Las 3 copias (`reportes-e`, `ranking-k`, `reasignacion-cart-cap`) se unificaron en
`core/data/remote/instances/mod-reportes-e.service.ts` (nuevo archivo). Se repuntaron 13 archivos
consumidores al nuevo import; se borraron las 3 copias locales.

**Decisión que no era mecánica:** la copia de `reasignacion-cart-cap` tenía un parámetro de
constructor extra, `datosReporte: ModRepService`, inyectado pero **nunca usado** en el cuerpo de
la clase. Si se conservaba, `reportes-e.module.ts` y `ranking-k.module.ts` habrían necesitado
agregar `ModRepService` a sus `providers` (que hoy no tienen) solo para evitar un
`NullInjectorError` en runtime, sin que ese servicio se fuera a usar nunca ahí. Se eliminó el
parámetro de la versión unificada en vez de propagar una dependencia muerta a dos módulos más.
`reasignacion-cart-cap.module.ts` sigue proveyendo `ModRepService` porque su
`principal.component.ts` sí lo inyecta, para otro fin.

**Hallazgo de paso:** `ranking-k.module.ts` importaba `ModReportesEService` pero no lo usaba ni
en su `providers` ni en ningún componente — import muerto, eliminado en el mismo commit.

---

## Fase 2 — H-06: en curso

Consumidores reales de `stg-table4` encontrados (`grep -rn "stg-table4" src`):

| Archivo | Usos | Estado |
|---|---|---|
| `reportes/repositorio/cero-cuotas/cero-cuotas.component.html` | 1 | **Dentro de un bloque `<!-- ... -->` ya comentado** (líneas 164-188) — no se renderiza nunca. No requiere migración; candidato aparte a limpieza de HTML muerto (no se toca todavía, fuera del alcance de esta tarea). |
| `reportes/repositorio/gestion-comercial/gestion-comercial.component.html` | 3 | Vivos, pendiente de migrar |
| `reportes/repositorio/ranking-comercial/ranking-comercial.component.html` | 1 | Vivo, pendiente de migrar |

### Commit `507d570` — Tarea 2.2 completa (colapsa `stg-table4` sobre `stg-table2`)

**El análisis original de H-06 estaba desactualizado.** Decía "stg-table2 implementa
ordenamiento con MatSort... stg-table4 no". Al leer el código actual (los componentes
divergieron del análisis en algún punto posterior) resultó ser al revés en la práctica:

- `stg-table2` tenía `@ViewChild(MatSort) sort` + `onSortChange(event: Sort)` + `sortReady`,
  pero **su propia plantilla no tenía ningún `matSort`/`mat-sort-header` conectado** — había un
  bloque entero comentado (`<!-- ... mat-sort-header ... -->`) con un enfoque de tabla distinto
  (`*matColumnDef`/`*matHeaderCellDef`) que nunca se terminó. Resultado: el "ordenamiento" de
  `stg-table2` era código muerto, inalcanzable desde el template.
- `stg-table4` sí tenía ordenamiento funcional: click en el `<th>` → `onHeaderClick` → `sortData`
  con una función `parseValue` que limpia comas/símbolos y intenta parsear números, con un
  guard: si el string original tiene alguna letra (ej. `"S/ 1,000"`), no se parsea como número y
  se ordena como texto en minúsculas.

Las 2 pantallas vivas que usan `stg-table4` (`gestion-comercial`, `ranking-comercial`) ya tienen
`[enableSort]="1"` hoy y dependen de ese ordenamiento funcional. Seguir el plan al pie de la
letra (forzar `enableSort="0"` al migrar) habría **apagado un ordenamiento que hoy funciona** —
exactamente lo que el plan quería evitar, solo que basado en una premisa que dejó de ser cierta.

**Verificación antes de tocar nada:** se escribió `stg-table4.component.spec.ts` (8 casos,
instancia el componente directamente sin TestBed/DOM) que caracteriza el comportamiento real,
incluida la particularidad del guard de letras. Corrió en verde contra el `stg-table4` original.
Se portó el mismo `onHeaderClick`/`sortData` a `stg-table2.component.ts` (reemplazando el
`MatSort` muerto) y se escribió el mismo spec contra `stg-table2` — 16/16 en conjunto, paridad
exacta confirmada **antes** de tocar las 4 plantillas vivas.

**Cambios de esta tarea:**
- `stg-table2.component.ts`: fuera `MatSort`/`onSortChange`/`sortReady` (muerto); dentro
  `onHeaderClick`/`sortData` portados de `stg-table4`.
- `stg-table2.component.html`: agregado `(click)="onHeaderClick(th)"`, cursor y flechas ▲▼ en
  el header (igual que `stg-table4`); eliminado el bloque comentado de `mat-sort-header`.
- `gestion-comercial.component.html` (3 usos) y `ranking-comercial.component.html` (1 uso):
  `<stg-table4>` → `<stg-table2>`, `[enableSort]="1"` preservado tal cual estaba.
- Eliminado `core/screen/components/stg-table4/` completo (4 archivos) y su entrada en
  `shared-cwc.module.ts`.
- **No se tocó** el uso de `stg-table4` en `cero-cuotas.component.html`: está dentro de un
  bloque `<!-- ... -->` que ya estaba comentado antes de esta sesión (líneas 164-188), nunca se
  renderiza. No necesitaba migración. Queda como candidato aparte para una limpieza de HTML
  muerto que no se hizo en esta sesión (Tarea 1.5 solo cubrió `.ts`, no plantillas).

`npm run build` y la suite completa (121/121, incluye los 8 tests nuevos de `stg-table2`) en
verde.

---

## Pendiente de Fase 2

- **Tarea 2.3 (resto de H-06):** definir la tabla unificada sobre `stg-table3` (el diseño con
  contrato tipado) y migrar `stg-table`/`stg-table2` hacia ella. No se empezó.
- **H-08:** consolidar `incentivos3`, `incentivos4`, `incentivos-a` (las 3 generaciones activas
  restantes tras borrar `incentivos2` por huérfana) en un único módulo parametrizado por
  campaña. No se empezó — es la tarea de mayor tamaño/riesgo del plan (semanas, no horas).
- **H-16:** 339 NgModules para 302 componentes — pendiente, depende de que H-06/H-07/H-08 estén
  resueltos primero según el orden que fija el plan.
