# Diseño de la tabla unificada `StgTableComponent`

> Tarea 2.3 del plan (`doc/01-analisis/03-plan-refactorizacion.md:742-767`), Paso 1 y Paso 2.
> Cierra el resto de [H-06](../01-analisis/02-analisis-refactorizacion.md#h-06). Generado 2026-07-25.

## Resumen ejecutivo — el plan escrito tenía una premisa que no sobrevivió al inventario real

El plan dice: *"`stg-table3` es la única de las cuatro con contrato tipado... Es la base correcta"*.
Tras inventariar **los 82 consumidores reales** de las 3 tablas vivas (`stg-table`, `stg-table2`,
`stg-table3`; `stg-table4` ya se colapsó en Tarea 2.2), el dato duro es el opuesto:

| Componente | Consumidores reales en producción | Capacidades reales que aporta |
|---|---|---|
| `stg-table3` | **1** (`demo-table3`, un playground/demo) | Headers tipados, multinivel, grid configurable — nada más. Sin sort, sin outputs, sin formato por tipo, sin edición, sin iconizer/acciones |
| `stg-table` (v1) | **22** (+ 1 plantilla compartida reusada por 4 más) | Formato por tipo vía `mat-table`, iconizer, acciones+diálogo, edición inline (`onEditCell`), selección de fila |
| `stg-table2` | **60** | Sort por click, pipe de formato genérico (`dynamicFormatPipe`: integer/decimal/percent/pbs/trafficlight/truncate/icon/chip/link/custom), `cellStyleFn`/`rowStyleFn`, sticky, headers anidados, drill-down vía `onClickCell` |

**Esto es la misma clase de error que ya corrigió la Tarea 2.2 en H-06**: el análisis original se
escribió mirando el contrato de los componentes, no su uso real, y quedó desactualizado. Igual que
entonces, seguir el plan al pie de la letra (extender `stg-table3`) significaría reconstruir desde
cero — sobre una base con 1 consumidor — capacidades que `stg-table2` ya tiene battle-tested en 60
pantallas de producción.

**Recomendación (desviación documentada del plan escrito):** la tabla unificada se construye
**extendiendo `stg-table2`**, no `stg-table3`. `stg-table3` se retira sin necesidad de portarle
nada (su único consumidor, `demo-table3`, es un demo, no una pantalla de negocio — se migra o se
borra en el Paso 5 igual que las demás). Lo que sí hay que portar a la base son las capacidades de
`stg-table` (v1) que `stg-table2` no tiene: edición inline real (`onEditCell`), acciones con
diálogo, e iconizer. El pipe `dynamicFormatPipe` (que ya soporta `icon`) puede absorber el
iconizer de v1 sin duplicar lógica.

> Si se prefiere seguir el plan tal como está escrito (extender `stg-table3`), avisar antes de
> arrancar el Paso 3 — implica escribir de cero, contra 0 consumidores reales de referencia, todo
> lo que `stg-table2` ya resuelve en producción.

---

## Inventario de capacidades — qué usa cada consumidor real

### `stg-table3` (1 consumidor)

| Archivo | Capacidades usadas |
|---|---|
| `reportes/repositorio/demo-table3/demo-table3.component.html` | Headers anidados hasta 4 niveles (el caso más profundo de las 3 tablas), `header.sticky`, `grid.type`. Datos falsos generados por `StgTable3Service.buildDemoData`. Sin sort, sin selección con output, sin formato por tipo. |

### `stg-table` v1 (22 consumidores reales)

| Capacidad | Consumidores que la usan realmente |
|---|---|
| Formato por `type` (number/number2d/percent/comp_f/input) | `pre-linea-simple` (+ 4 reusos), `pre-act-cartera-creditos`, `captacion-canal-operacion` |
| `iconizer` | 1 solo caso real: `pre-ges-seg-tablero-verificacion` (estado → ícono con color) |
| `actions` + `actionTrigger` (botón que abre diálogo) | 4 casos, mismo patrón: `destino-credito`, `registro-transaccion`, `transaccion`×2 (actividades/corresponsales) |
| `activeSelection` + `onSelectRow` | 5 casos, todos son "pickers" de selección para diálogo: `basenegativa/buscador`, `kaypacha/buscador`, `Kaypacha2/buscador`, `Kaypacha3/buscador`, `sec-picker-dialog` (este último **marcado `@deprecated`** a favor de `TablePickerDialogComponent`) |
| `onEditCell` (edición inline funcional) | Solo 3 de verdad: `pre-linea-simple` (+ reusos), `pre-act-cartera-creditos` (1ª de 3 tablas), `esg` (solo tab "Medioambiente", 1 de 4 tabs) |
| `customCellStyler` | Muy común, ~15 de los 22 |
| `customValueFormatter` | 1 caso: `rep01-dashboard-clientes` |
| `customComponentCell`/`customComponentStyler` | Bindeados en ~8 archivos pero **muertos en 6 de ellos** (sin `comp_f`/`input` en ningún header que los dispare) — solo funcionales en `pre-linea-simple` y `pre-act-cartera-creditos` |
| `sticky` (columna fija) | Varios (`pre-ges-*`, `captacion-canal-operacion`, `comite` con *todas* las columnas sticky, `segui-incentivos-sec`) |

### `stg-table2` (60 consumidores reales)

| Capacidad | Alcance de uso |
|---|---|
| Pipe `dynamicFormatPipe` (`format:{type,params}`) | El mecanismo de formato dominante: `integer`, `decimal`, `percent` (con `trafficFn` para semáforo), `custom` (con `typeFn` que resuelve el tipo en runtime), `truncate`, `icon`, `chip`, `link`. Presente en la mayoría de los 60 |
| `enableSort=1` | Solo 8 de 60: `det-mora`, `gestion-comercial` (5 instancias), `imr`, `panel-misionales` (5), `poblacion-misional` (4), `ranking-comercial`, `reasignado`, `zplantilla` |
| `cellStyleFn` / `rowStyleFn` a nivel de columna/config | Muy común, la forma dominante de estilos condicionales (semáforos, colores por signo, resaltado por umbral) |
| `sticky` | **Dos mecanismos conviviendo sin coordinación:** el flag declarativo `sticky:true` en el header (funciona, vía `body.stickyCols`/columna) y estilos CSS manuales `position:sticky` inyectados a mano en `style`/`cellStyle` (`mon-ran-camp`) — inconsistente, candidato a unificar en la tabla nueva |
| Headers anidados (`subs`) | Común (`carterizacion`, `usa_come`, `ranking-comercial`, `mon-ran-camp`, etc.), hasta 3 niveles |
| Selección de fila + `onSelectRow` | Poco común (~6 de 60), sobre todo en componentes tipo picker/lista (`usuarios`, `becas`, `prospecto/principal`, `framework-esg`, `tbl-picker-dialog`) |
| `onClickCell` para drill-down | El patrón de interacción dominante en reportes (no selección de fila): navegación jerárquica (`ddHier`), apertura de diálogo de detalle, o navegación a otra vista |
| `optionsObserver` (Subject para cambiar config en runtime) | Declarado en varios pero **casi siempre sin usar** (`.next()` nunca se llama) — candidato a simplificar/eliminar si el inventario completo lo confirma |

---

## Defectos y código muerto encontrados de paso (fuera de alcance de Tarea 2.3, no tocar aquí)

Ninguno de estos se corrigió — son observación de lectura, no tienen test de caracterización
todavía. Se documentan para no perderlos, siguiendo la disciplina del proyecto de registrar
hallazgos en vez de arreglarlos de pasada.

- 🔴 **`ranking-k/detallek` y `ranking-k/principal` usan `eval()` sobre JSON devuelto por el
  backend** (`r.list[0].JSONLIST`, `r.datTable`) para construir `dataSource`. Es ejecución de
  código arbitrario a partir de una respuesta de red — mismo tipo de riesgo que ya señala
  [H-04](../01-analisis/02-analisis-refactorizacion.md#h-04)/[H-05](../01-analisis/02-analisis-refactorizacion.md#h-05)
  sobre manejo de seguridad. Vale la pena una entrada propia en el análisis de hallazgos, no solo
  aquí.
- `reportes/repositorio/precosechas/rep01-precosechas.component.html`: `headerDefs` nunca se
  asigna en el `.ts` → la tabla se renderiza sin columnas. Pantalla rota hoy.
- `presupuesto/gestion/sistema/responsables/pre-ges-sis-responsables.component.html`: columna
  `input` se renderiza (parece editable) pero `onEditCell` está comentado → la edición no persiste
  ni notifica. Edición "fantasma".
- `seguros-pasivos.component.html`: pasa `[customCellStyler]` a `stg-table2`, que **no tiene** ese
  `@Input` (confirmado en el `.ts`) — binding inválido sin efecto. Además su 5º tab referencia
  `dataSource5`/`headerDefs5`, que no existen en la clase — tab roto.
- `gestion-comercial.component.html`: rama `activeTab === 'riesgos'` (`dataSource2`/`headerDefs2`)
  es inalcanzable — `activeTab` nunca toma ese valor.
- `reasignacion-cart-cap`: `headOpt2`/`tblOpts2` del `.util.ts` sin usar, copiados de otro módulo.
- `desembolsos`/`desembolsos-m`: hacen manipulación directa del DOM renderizado
  (`querySelector('stg-table2')` + `MutationObserver`) para colorear celdas, evitando por completo
  la API de estilos del componente — antipatrón a no repetir en la tabla nueva.
- Grupo `actividades`/`corresponsales` (5 archivos): `customComponentCell`/`customComponentStyler`/
  `iconizerMap` bindeados sin ningún header que los dispare — inputs muertos, consistentes con el
  patrón "copiar y versionar" que describe el diagnóstico general del proyecto.
- `options.body.rowClassFn` aparece en varios `.util.ts` de consumidores de `stg-table2`
  (`carterizacion`, `desembolsos`) pero no se encontró ningún lugar en
  `stg-table2.component.ts`/`.html` que lo lea — probable configuración muerta, cargo-culteada
  entre módulos.

---

## Propuesta de API unificada

Superconjunto tipado, extendiendo el contrato real de `stg-table2` (options, headers con `format`,
`enableSort`) y sumando de `stg-table` v1 solo lo que `stg-table2` no cubre (`onEditCell` real,
`actions`, iconizer ya cubierto por el pipe existente).

```typescript
// core/screen/components/stg-table-unified/stg-table.util.ts (nombre tentativo)

export interface IStgTableHeader {
  key?: string;                       // ausente = columna decorativa/spacer
  label: string;
  style?: { [cssProp: string]: string };
  subs?: IStgTableHeader[];           // headers anidados, N niveles (ya soportado por las 3 tablas)
  sticky?: boolean;                   // columna fija — UN solo mecanismo, sin CSS manual paralelo
  format?: {                          // delega en DynamicFormatPipe, ya probado en 60 pantallas
    type: 'integer' | 'decimal' | 'percent' | 'pbs' | 'trafficlight' | 'truncate'
        | 'icon' | 'chip' | 'link' | 'custom' | 'input';  // 'input' = nuevo, activa edición inline
    params?: any;
  };
  actions?: IStgTableAction[];        // botones con dialog, portado de stg-table v1
  cellStyleFn?: (params: { key: string; value: any; rowData: any }) => { [cssProp: string]: string };
}

export interface IStgTableAction {
  icon: string;
  trigger: (evt: { row: any; key: string; value: any }, ctx: { dialog: MatDialog }) => void;
}

export class StgTableOptions {
  grid?: { enabled?: boolean; mode?: 'full' | 'only_headers' | 'bottom'; border?: string };
  header?: { sticky?: boolean; style?: {...}; cellStyle?: {...} };
  body?: {
    style?: {...};
    cellStyle?: {...};
    rowStyleFn?: (row: any) => { [cssProp: string]: string };
    hover?: { enabled?: boolean; style?: {...} };
    selection?: { enabled?: boolean; style?: {...} };
    loading?: { enabled?: boolean; rows?: number };
  };
  sort?: { enabled?: boolean };        // reemplaza el `enableSort: number` (0/1) por boolean tipado
}
```

```typescript
@Component({ selector: 'stg-table' /* nombre final a decidir: ¿reemplaza el selector v1? */ })
export class StgTableUnifiedComponent {
  @Input() columns: IStgTableHeader[] = [];
  @Input() dataSource: any[] = [];
  @Input() options: StgTableOptions = new StgTableOptions();
  @Input() optionsObserver?: Subject<Partial<StgTableOptions>>;  // solo si el inventario confirma uso real

  @Output() onSelectRow = new EventEmitter<any>();
  @Output() onClickCell = new EventEmitter<{ value: any; key: string; row: any }>();
  @Output() onEditCell = new EventEmitter<{ row: any; key: string; value: any; oldRow: any }>();
}
```

**Decisiones de diseño y su porqué:**

1. **Un solo mecanismo de `sticky`**, el flag declarativo — elimina la inconsistencia observada
   entre `sticky:true` y `position:sticky` manual.
2. **`format.type: 'input'` reemplaza el `type:'input'` de v1** para edición inline, reutilizando
   el pipe existente en vez de bifurcar el renderizado de celda otra vez.
3. **`enableSort` pasa de `number` (0/1) a `options.sort.enabled: boolean`** — tipado, consistente
   con el resto de flags de options. Requiere `[sort]="{enabled:true}"` en vez de `[enableSort]="1"`
   en las migraciones (mecánico, mismo significado).
4. **`optionsObserver` queda condicionado a que el inventario completo confirme uso real** — de los
   casos vistos hasta ahora, casi siempre se declara y nunca se emite. Si el patrón se confirma al
   migrar consumidor por consumidor, se retira antes de cerrar la tarea (menos superficie, no más).
5. **No se portan `customComponentCell`/`customComponentStyler`** tal cual — de los ~10 usos
   reales en v1, solo 2 (`pre-linea-simple`, `pre-act-cartera-creditos`) los usan de verdad, y
   ambos son casos de "renderizar `input`/`number`/`percent` según una condición de subclase", que
   ya cubre `format.type` + `params` sin necesitar un input adicional. Se resuelve con
   `format:{type:'custom', params:{typeFn: ...}}` (mismo patrón que ya usan `usa_come`/`carterizacion`
   en `stg-table2`).
6. **`rowClassFn` no se incluye** — no se encontró ningún punto del código que lo lea; si el Paso 4
   (migración por dominio) encuentra un consumidor que de verdad lo necesite, se añade ahí con
   evidencia, no antes.

---

## Paso 3 — completado

El usuario confirmó la desviación de base (extender `stg-table2`). Se portaron con TDD las dos
capacidades que le faltaban frente a `stg-table` v1:

- **`onEditCell`** (edición inline): commit `4a3286c`. `onEditInput` portado tal cual desde
  `stg-table.component.ts`; la plantilla especializa `format.type === 'input'` con un `<input>`
  real (bypassa el pipe, que renderiza vía `[innerHTML]` y no puede llevar bindings de Angular).
- **`actions`/`actionTrigger`** (botones con diálogo): commit `b638958`. `runTrigger` portado tal
  cual; se inyectó `MatDialog` en el constructor y se agregó `@Input() actionTrigger`.
- **Iconizer no requirió puerto**: `dynamicFormatPipe` ya soporta `format.type:'icon'`, cubre el
  único caso real (`pre-ges-seg-tablero-verificacion`).

`npm run build` + suite completa en verde después de cada incremento (121→123→124 tests).

## Paso 4 — en curso

Migrar consumidores por dominio, un dominio por PR (commit), de menor a mayor riesgo:

1. ✅ **Los 5 "pickers"** (commit `9fdf6b1`): `basenegativa/buscador`, `kaypacha/buscador`,
   `Kaypacha2/buscador`, `Kaypacha3/buscador`, `sec-picker-dialog`. Este último SÍ se migró (no se
   borró) porque, pese a estar marcado `@deprecated` en el código, tiene un consumidor real activo
   (`report-crs-v6.component.ts:261`, `dialog.open(SecPickerDialogComponent, ...)`). Se agregó de
   paso el override `loadingObs` a `stg-table2` (commit `7ec1263`), necesario para distinguir
   "cargando" de "búsqueda sin resultados" — brecha que el inventario de Paso 1 no había
   detectado.
2. ✅ **Grupo `actividades`/`corresponsales`** (commit `c056b3b`): `destino-credito`,
   `registro-transaccion`, `transaccion` (actividades), `transaccion` (corresponsales). Corrección
   sobre el inventario de Paso 1: `registro-transaccion` NO tiene ninguna columna con `actions`
   (a diferencia de los otros 3), así que ahí se retiró `actionTrigger` en vez de portarlo.
   Efecto colateral verificado y documentado en el commit: `loadingObs` nunca se seteaba en estos
   4 componentes (bug preexistente), por lo que ahora el skeleton de carga de `stg-table2`
   aparece automáticamente durante la carga — mejora, no regresión.
3. ✅ **`pre-linea-simple` (+ 4 reusos) y `pre-act-cartera-creditos`** (commits `4df6220` +
   `bc43dc2`) — el dominio de mayor riesgo, con `onEditCell` real y cálculo en cascada
   (`calculateRow`). Requirió agregar antes `resolveFormatType` a `stg-table2` (edición
   condicional POR FILA, no solo por columna) y un test de caracterización de 10 casos sobre
   `customComponent()` antes de tocarla. Las 4 pantallas que reusan literalmente el mismo
   `templateUrl` (`cartera-depositos-bp/red`, `seguros-comercial/operaciones`) quedaron migradas
   sin tocar sus propios `.ts` — no declaran `tableConf`/`customComponent` propios.
4. ✅ **Los 22 de 22 archivos originales están migrados** (confirmado con
   `grep -rlE "<stg-table[^0-9a-zA-Z_-]" src --include=*.html` → cero resultados fuera de
   `core/screen/components`). Detalle completo de cada uno, commit por commit, en
   `doc/02-bitacora/10-checkpoint-tarea23.md`. Hallazgos notables en el camino:
   - `pre-ges-sis-responsables`: la "edición fantasma" que sugería el inventario de Paso 1 **no
     era tal** — `onEditInput` muta el mismo objeto de `dataSource`/`bdataSource`, así que
     `save()` sí persiste el valor tecleado aunque no haya listener `(onEditCell)`.
   - `registro-transaccion` no tenía `actions` real (a diferencia de los otros 3 del mismo grupo)
     — se verificó en el código, no se confió en el inventario original.
   - `esg`: bug preexistente confirmado — `tableConf3`/`tableConf4` nunca se asignaban (el import
     nunca existió), tabs 3/4 siempre usaron la config por defecto. Se preservó tal cual.
   - `rep01-precosechas`: además del bug ya documentado (`headerDefs` nunca se asigna), se encontró
     un segundo bug — el template usa `dataSource1`, una propiedad que tampoco existe. Pantalla
     doblemente rota. Se preservó tal cual, no se corrigió de paso.
   - `report-crs-v6`: el defecto congelado D-02 (`doc/02-bitacora/06-defectos-detectados.md`) se
     preservó intacto — el test de caracterización (`report-crs-v6.component.spec.ts`, Tarea 1.3)
     sigue en verde, confirmando que `detectChanges()` sigue lanzando el mismo `TypeError`.
   - `rep01-movimiento-clientes.util.ts`/`report-crs-v6.component.ts` comparten un `tableConf`
     acoplado: se agregaron `tableConfV2`/`tableConf2V2` en paralelo (schema stg-table2) sin tocar
     las constantes v1 originales, para no romper report-crs-v6 antes de migrarlo.
5. `ranking-k/detallek` y `ranking-k/principal` (el `eval()` sobre JSON del backend) **nunca
   fueron parte de esta lista** — ya eran consumidores de `stg-table2` desde antes de esta tarea,
   no de v1. El hallazgo de seguridad sigue pendiente de decisión aparte, sin relación con la
   migración de la tabla.

## Paso 5 — completado ✅

Commits `01791cd` (limpieza de `IStgTableHeader` en 13 archivos, prerequisito) y `031196c`
(borrado final). Se confirmó con el usuario borrar `demo-table3` entera (era un playground, no
una pantalla de negocio) en vez de migrarla. Se encontró y limpió de paso un registro de
`StgTable3Service` como `provider` en `mon-imr.module.ts`/`mon-salidas.module.ts` — dos módulos
sin ninguna relación con `demo-table3`, nunca lo inyectaban (otro residuo de copiar-pegar).

**Con esto, Tarea 2.3 (H-06) queda cerrada por completo — Pasos 1 a 5.**

## (Referencia) Paso 5 original — borrar `stg-table` v1 y `stg-table3`

**No es tan simple como borrar 3 archivos.** Verificado con grep tras cerrar Paso 4:

- **`IStgTableHeader`** (la interfaz de tipos de v1, en `stg-table.interface.ts`) todavía la
  importan **13 archivos** que son consumidores de `stg-table2` desde antes de esta tarea (no
  parte de los 22 migrados aquí): `destino-credito`, `registro-transaccion`, `transaccion`×2,
  `carterizacion`, `desembolsos`, `desembolsos-m`, `ingresosApp`, `reprogramApp`,
  `seguros-pasivos`, `usa_come`, `usa_come-m`, `usabilidadMis`. La usan solo como anotación de
  tipo (`headerDefs: IStgTableHeader[]`), sin ninguna dependencia en tiempo de ejecución — hay que
  cambiarlos a `any[]` (mismo patrón que los 22 ya migrados) antes de poder borrar el archivo.
- **`stg-table.util.ts`** (con `STG_GRID_STYLE`, `STG_INPUT_TABLE_BACKGROUND`,
  `prepareDataForPagination`) **NO se borra** — pese al nombre del archivo, ninguna de sus 3
  exportaciones es específica del componente v1; son utilidades genéricas usadas por decenas de
  consumidores de ambas tablas y de paginación en general. Solo se borran
  `stg-table.component.ts/.html/.scss` y `stg-table.interface.ts`.
- **`stg-table3`**: su único consumidor real es `demo-table3` (un playground, no una pantalla de
  negocio). Decidir con el usuario si se borra directo o se migra a un demo de `stg-table2`.
- Tras limpiar lo anterior: quitar `StgTableComponent`/`StgTable3Component` de
  `shared-cwc.module.ts` (imports + array `components`), borrar los 3 directorios, y confirmar con
  `grep -rn "StgTableComponent\|StgTable3Component\|stg-table\.interface" src` que no queda nada.

**Patrón mecánico ya validado en 2 dominios (9 archivos):** `<stg-table>` → `<stg-table2>`,
`[headersDef]` → `[headers]`, `[tableStyleConfig]` (schema v1: `table.height/grid`,
`header.text-align/min-width/color`) → `[options]` (schema v2: `grid.border`,
`header.cellStyle`), `activeSelection="true"` → `[options]="{body:{selection:{enabled:true}}}"`,
`[loadingObs]` se mantiene igual. Antes de portar `customComponentCell`/`customComponentStyler`/
`iconizerMap`/`actionTrigger`, **verificar en el código real** (no solo confiar en el inventario
de Paso 1) si algún header realmente los dispara — varios están bindeados pero muertos.
