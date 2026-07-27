# Inventario de NgModules (H-16, Tarea 2.6, Paso 1)

> Cierra el Paso 1 de la Tarea 2.6 (`doc/01-analisis/03-plan-refactorizacion.md:821-829`):
> *"Inventariar los 339 NgModules y clasificar: de routing / de un solo componente / agrupadores
> reales"*. Generado 2026-07-26 con un script AST (TypeScript compiler API, no regex — un primer
> intento con regex clasificó mal ~34 módulos por no resolver `declarations: identificador` sin
> corchetes; ver "Metodología").

## Números de hoy vs. el análisis original

| | Análisis original (H-16) | Hoy |
|---|---|---|
| `.module.ts` totales | 339 | **331** |
| Componentes (`.component.ts`) | 302 | **308** |

La baja de 339→331 es consistente con las eliminaciones de Fase 2 (huérfanos, `stg-table4`,
`stg-table` v1, `stg-table3`, `demo-table3`). El objetivo de Paso 5 ("menos NgModules que
componentes") sigue sin cumplirse — 331 vs 308, todavía 23 de más.

## Metodología

Un script recorre `src/app` buscando `*.module.ts`, parsea cada uno con el compilador de
TypeScript (no regex) y cuenta cuántos elementos tiene el arreglo `declarations` del decorador
`@NgModule(...)`, resolviendo tanto `declarations: [A, B, ...componentes]` como
`declarations: componentes` (una referencia directa sin corchetes — el patrón que un primer
intento con regex no capturaba, y que representaba ~34 módulos mal clasificados como "0
declaraciones" cuando en realidad tenían 1). El script vive en el scratchpad de la sesión, no en
el repo — es una herramienta de auditoría puntual, no algo para mantener en `scripts/`.

## Clasificación (331 archivos)

| Categoría | Cantidad | Nota |
|---|---|---|
| **De routing** | **142** | 134 con el sufijo estándar `-routing.module.ts` + 8 con nombres no estándar (`editar-routing-cor.module.ts`, `guardar-routing-pm.module.ts`, y 4 archivos `xxx.routing.module.ts` en `agro-mix-d`/`banca-solidaria`/`cero-cuotas`/`gestion-comercial`) |
| **No son NgModules de Angular** | **4** | `reportes/legacy/comercial/com-map.module.ts`, `.../support/common/date.module.ts`, `filter-locale.module.ts`, `theme.module.ts` — archivos de utilidades (funciones + interfaces) con el sufijo `.module.ts` por una convención de nombres antigua ("módulo" = "archivo"), sin `@NgModule`, sin clase. Se excluyen del resto del análisis; candidato aparte a renombrar (fuera de alcance de H-16) |
| **De un solo componente** | **91** | `declarations` con exactamente 1 componente. Candidatos directos al Paso 2 (fusionar en el módulo de su dominio) |
| **Agrupadores reales (2-4 componentes)** | 36 | Agrupan una pantalla con sub-componentes reales (tabs, diálogos) |
| **Agrupadores reales (5+ componentes)** | 10 | `shared-cwc.module.ts` (23), `incentivos3.module.ts` (17), `incentivos4.module.ts` (10), `shared-cmc.module.ts` (8), `admin-directives.module.ts` (8), `incentivos-a.module.ts` (9), `rda-administracion.module.ts` (7), `kaypacha.module.ts` (7), `rda-sectorista.module.ts` (6), `sistematica.module.ts` (5) — legítimos, no se tocan |
| **0 declaraciones** | 48 | Ver desglose abajo — no es una categoría uniforme |

### Desglose de "0 declaraciones" (48) — dos patrones distintos

1. **~34 son wrappers de indirección de ruteo con imports muertos.** Patrón encontrado en
   `reportes/organizacion/actividad-diaria/*` y `actividad-mensual/*` (ej.
   `rep01-asesor.module.ts`, `rep01-mora.module.ts`, `rep01-agro-mix-m.module.ts`): un módulo de
   ~24-29 líneas que **no declara ningún componente**, solo importa su propio
   `xxx-routing.module.ts` (que a su vez hace `loadChildren` hacia el módulo real en
   `repositorio/`) más `CommonModule`/`FlexLayoutModule`/`MatCardModule`/`SelectModule`/
   `TableModule`/`SharedComponentsLegacyModule`. **Estos últimos 4-5 imports son código muerto
   estructural**: el módulo no declara nada que pueda consumirlos, y no tiene `exports` — no
   pueden llegar al módulo real (que se carga vía `loadChildren`, un límite de inyector aislado en
   Angular; no hereda imports de quien lo carga). Confirmado con `grep`: 34 de los 48 archivos de
   este bucket importan `SharedComponentsLegacyModule`/`TableModule`/`SelectModule` sin usarlos.
2. **~14 son agregadores legítimos** sin componentes propios, dos variantes:
   - Puramente de routing sin el sufijo (`rep01-organizacion.module.ts`,
     `rep01-actividad-diaria.module.ts`, `pre-gestion.module.ts`, `pre-lineas.module.ts`, etc.):
     solo importan su propio routing module + `CommonModule`, sin los imports muertos del patrón
     anterior. Funcionalmente son "de routing" aunque no lo diga el nombre del archivo.
   - Wrappers de re-export puro (`shared-material.module.ts`): agrupan e importan/exportan
     módulos de Angular Material para que otros los consuman con un solo import. Legítimos,
     no se tocan.

**Hallazgo colateral (cosmético, no funcional):** `rep01-mora-routing.module.ts` declara la clase
`Rep01PrecosechasRoutingModule` — nombre de un copy-paste nunca actualizado al renombrar el
archivo/carpeta de "precosechas" a "mora". El routing en sí funciona correctamente (enruta bien a
`precosechas` y `det-mora` como hijos), es solo el nombre de la clase el que quedó mal. No se
corrigió (fuera de alcance de un inventario de solo lectura).

## Routing modules desproporcionados (Paso 4 del plan)

| Archivo | Líneas |
|---|---|
| `reportes/legacy/comercial/rda/administracion/rda-administracion-routing.module.ts` | **726** |
| `reportes/legacy/comercial/rma/administracion/rma-administracion-routing.module.ts` | 383 |
| `reportes/legacy/comercial/rda/sectorista/rda-sectorista-routing.module.ts` | 215 |
| `app-routing.module.ts` | 160 |
| `reportes/organizacion/actividad-diaria/rep01-actividad-diaria-routing.module.ts` | 138 |

El caso citado por el plan (`rda-administracion-routing.module.ts`, 726 líneas) es, con amplio
margen, el más grande de los 142 — casi el doble del segundo. Ambos viven en `reportes/legacy/`,
fuera del alcance de consolidación de Fase 2 (Fase X los retira enteros).

## Paso 2 — primer incremento completado ✅

Commit `690e826`: se eliminaron los imports muertos de los **32** wrappers de indirección de
ruteo (de los 34 detectados, 2 quedaron fuera porque son los módulos compartidos reales:
`shared-material.module.ts` y `shared-components.module.ts`, que sí definen/exportan esas cosas).
Verificado con AST antes de tocar nada: los 32 eran idénticos en forma (`declarations` y
`exports` ausentes, mismos 6 imports muertos + su propio `*RoutingModule`). Cada archivo se
reconstruyó desde una plantilla fija (más seguro que hacer *splicing* de texto en el original,
que en un primer intento dejó un `import` roto por un bug de cálculo de rangos). `npm run build`
+ suite completa (158/158) en verde.

**Próximo paso concreto (resto del Paso 2 del plan):** fusionar los 91 módulos "de un solo
componente" en el módulo de su dominio. Volumen mucho mayor que el quick win — hacerlo por lotes
de dominio (ej. todos los de `reportes/repositorio/`, luego `presupuesto/`, etc.), verificando
antes de cada fusión quién más importa el módulo que se va a fusionar (para no romper un
`loadChildren` que apunte específicamente a él).

**Fusionar los 91 "de un solo componente" en el módulo de su dominio** (el Paso 2 tal como lo
describe el plan) es un trabajo de mayor volumen — 91 módulos, cada uno requiere verificar quién
importa el módulo actual antes de fusionarlo, para no romper un `loadChildren` que apunte
específicamente a él. Se recomienda hacerlo por lotes de dominio (ej. todos los de
`reportes/repositorio/`, luego `presupuesto/`, etc.), no los 91 de una sola vez.
