# Tablas

Las tablas del Host, agrupadas. Son **tres componentes distintos, no tres versiones de lo mismo**:
cada uno resuelve una forma de tabla que las otras no cubren, y por eso conviven en vez de
fusionarse.

| Componente | Para qué | Contrato de columna |
|---|---|---|
| [`<app-data-table>`](../data-table/README.md) | Tabla plana con buscador, filtros por columna y paginador | `DataTableColumn` |
| `<app-tabla-reporte>` | Tabla **multi-encabezado**: cabeceras en varias filas con `colspan`/`rowspan`, tal como las manda el motor de reportes | `FilaEncabezadoReporte[]` |
| `<app-tabla-dinamica>` | Columnas **anidadas** (`subs`) y semáforos por celda, del motor `table.regular` | `ColumnaDinamica` |
| `<app-editable-table>` | Celdas **editables** en línea, con un nivel de agrupación | `ColumnaTabla` |

`<app-data-table>` vive aparte porque es la de propósito general: si tu tabla es plana y necesitás
buscador o filtros, empezá por ella.

```
tablas/
├── tabla-reporte/     multi-encabezado (colspan/rowspan)
├── tabla-dinamica/    columnas anidadas + semáforos
├── editable-table/    celdas editables
└── models/            los tres contratos de render
```

Los modelos de acá son **solo contrato de render**. Lo que devuelve el backend
(`TablaReporteResultado`, `TablaDinamicaResultado`, sus `TABLA_VACIA`…) se queda en el módulo dueño
del reporte, porque es forma de payload, no de UI.

## `<app-tabla-reporte>`

```typescript
// El número de `../` depende de dónde viva tu componente; no hay alias de rutas en el proyecto.
import { TablaReporteComponent } from '…/shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { TABLA_VACIA } from '…/pages/modules/reportes/models/tabla-reporte.model';
```

```html
<app-tabla-reporte
  [encabezados]="reporte().headers"
  [filas]="reporte().body"
  [cargando]="cargando()"
  [seleccionable]="true"
  (filaSeleccionada)="abrirDetalle($event)"
/>
```

| Input | Tipo | Por defecto | Para qué |
|---|---|---|---|
| `encabezados` | `FilaEncabezadoReporte[]` | — | **Requerido.** Una entrada por fila de cabecera |
| `filas` | `FilaReporte[]` | — | **Requerido** |
| `cargando` | `boolean` | `false` | Estado de carga |
| `seleccionable` | `boolean` | `false` | Hace las filas clicables |

| Output | Cuándo |
|---|---|
| `filaSeleccionada` | Clic en una fila (solo con `seleccionable`) |

Una columna con `hidden: true` no dibuja su `<th>` pero **sí conserva su dato en el cuerpo** — así
viaja el semáforo oculto de "TMM". El `style.background` de una columna pinta solo su encabezado,
no sus celdas.

## `<app-tabla-dinamica>`

```html
<app-tabla-dinamica
  [columnas]="reporte().columnas"
  [filas]="reporte().filas"
  [colorearVariaciones]="true"
  (filaSeleccionada)="bajarUnNivel($event)"
/>
```

| Input | Tipo | Por defecto | Para qué |
|---|---|---|---|
| `columnas` | `ColumnaDinamica[]` | — | **Requerido.** Con `subs` para agrupar |
| `filas` | `Record<string, unknown>[]` | — | **Requerido** |
| `cargando` | `boolean` | `false` | Estado de carga |
| `colorearVariaciones` | `boolean` | `false` | Pinta los negativos en rojo |
| `seleccionable` | `boolean` | `false` | Hace las filas clicables |

Una columna con `semaforoKey` lee ese campo de la fila (`-1`/`0`/`1`) y dibuja el punto de color,
mismo criterio que `<app-tabla-reporte>`.

## `<app-editable-table>`

`esEditable` decide celda por celda; por defecto **nada** es editable, así que hay que pasarlo para
que la tabla sirva de algo.

```html
<app-editable-table
  [columnas]="columnas"
  [filas]="filas()"
  [esEditable]="puedeEditar"
  (celdaEditada)="guardar($event)"
/>
```

```typescript
protected readonly puedeEditar = (fila: FilaLineaSimple, key: string) =>
  key.startsWith('a') && !fila['bloqueada'];
```

| Input | Tipo | Por defecto | Para qué |
|---|---|---|---|
| `columnas` | `ColumnaTabla[]` | — | **Requerido.** Con `hijos` para agrupar |
| `filas` | `T[]` | `[]` | Filas |
| `cargando` | `boolean` | `false` | Muestra skeletons |
| `conCaption` | `boolean` | `false` | Proyecta un caption propio |
| `esEditable` | `(fila, key) => boolean` | `() => false` | Qué celdas se pueden editar |

| Output | Cuándo |
|---|---|
| `celdaEditada` | Al confirmar una celda: `{ fila, key, valor }` |

`onCambio()` **muta la fila por referencia** además de emitir el evento, igual que el `editCell()`
del legado. Si tu estado es un signal de filas, ya vas a ver el valor nuevo sin reasignar nada —
pero por lo mismo no confíes en la inmutabilidad de esas filas.
