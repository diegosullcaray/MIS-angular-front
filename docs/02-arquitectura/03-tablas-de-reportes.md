# Cómo se crean las tablas de los reportes

De la respuesta del backend a la tabla en pantalla. Este es el camino que
recorre casi todo el sistema, así que conviene leerlo entero una vez.

---

## 1. Los dos contratos de tabla

El backend devuelve las tablas de **dos formas distintas**, y cada una tiene su
componente. No son dos versiones de lo mismo: resuelven cosas que la otra no
puede.

| | `<app-tabla-reporte>` | `<app-tabla-dinamica>` |
|---|---|---|
| Motor del backend | Mixto (`regularData`) | `table.regular` |
| Encabezado | Varias filas con `colspan`/`rowspan` | Columnas anidadas (`subs`) |
| Contrato | `FilaEncabezadoReporte[]` | `ColumnaDinamica[]` |
| Cómo llegan las cabeceras | Ya como array en `result.headers` | Como **JSON serializado** en `resultado.headers` |
| Semáforos | Columna oculta pegada al dato | `semaforoKey` por columna |

Hay además `<app-data-table>` para tablas planas con buscador y paginador, y
`<app-editable-table>` para celdas editables. Este documento cubre las dos de
reportes.

---

## 2. El camino completo

```
cod_rep (constantes/)
    ↓
Service del módulo  ──> BloqueReporteService ──> ModReportesService ──> backend
    ↓
utils/  (mapeo del payload)
    ↓
models/  (TablaReporteResultado | TablaDinamicaResultado)
    ↓
Componente de la pantalla
    ↓
<app-tabla-reporte> | <app-tabla-dinamica>
```

---

## 3. Tabla multi-encabezado (`<app-tabla-reporte>`)

Es la del motor mixto. La usan la mayoría de los reportes migrados del legado.

### Lo que devuelve el backend

```typescript
interface TablaReporteResultado {
  headers: FilaEncabezadoReporte[];   // una entrada por FILA de encabezado
  body: FilaReporte[];                // las filas de datos
  additional: Record<string, unknown>;
}
```

Cada fila de encabezado es una lista de columnas:

```typescript
interface FilaEncabezadoColumna {
  columnDef: string;    // la clave con la que se busca el dato en la fila
  header?: string;      // el texto del <th>
  cols?: number;        // colspan
  rows?: number;        // rowspan
  isdata?: number;      // 1 si esta columna trae dato en el cuerpo
  hidden?: boolean;     // oculta el <th> sin quitar su dato del cuerpo
  format?: Record<string, unknown>;
  style?: { background?: string; desktop?: { width?: string } };
}
```

### El service

```typescript
/** Cero y una Cuota. */
ceroUnaCuota(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
  return this.bloques.regulares(
    COD_CARTERA_MORA_PAREJAS.ceroUnaCuota.map((codRep) => ({ codRep })),
    nodo,
  );
}
```

`BloqueReporteService` ya aplica `mapearBloqueReporte`, así que el service no
mapea nada.

### El componente

Los reportes de un solo bloque extienden `ReporteSimpleBase`, que resuelve el
nodo de jerarquía, el estado de carga y el vacío:

```html
<app-tabla-reporte
  [encabezados]="reporte().headers"
  [filas]="reporte().body"
  [ajustarAncho]="true"
/>
```

### Semáforos

El backend manda la columna del semáforo **oculta y pegada** al dato que anota,
y espera que ese dato la cubra con `cols: 2`. Unas veces la oculta va antes del
dato y otras después: el componente lo resuelve mirando si la fila ya cierra el
ancho total. No hay que hacer nada del lado del reporte.

### Anchos

Por defecto se respeta el `style.desktop.width` que manda el backend. Con
`[ajustarAncho]="true"` se ignora y las celdas hacen salto de línea — útil en
las tablas con descripciones largas.

---

## 4. Tabla de columnas dinámicas (`<app-tabla-dinamica>`)

Es la del motor `table.regular`, la que usan los reportes del `repositorio`.

### Lo que devuelve el backend

```typescript
interface TablaRegularResultadoRaw {
  data?: unknown[];        // las filas
  headers?: string;        // ¡JSON SERIALIZADO! hay que parsearlo
  meta1?: string | Record<string, unknown>[];  // tarjetas KPI, si el reporte las trae
}
```

Y el contrato de columna:

```typescript
interface ColumnaDinamica {
  key: string;
  label: string;
  style?: Record<string, string>;      // estilo del <th>
  cellStyle?: Record<string, string>;  // estilo de las <td>
  format?: { type?: string };
  semaforoKey?: string;                // clave de la fila que trae -1/0/1
  cellStyleFn?: (valor, fila) => Record<string, string> | undefined;
  subs?: ColumnaDinamica[];            // columnas anidadas
}
```

### El service

```typescript
/** Estructura de Desembolsos, con la coloración condicional de la fila de distribución. */
estructuraDesembolsos(nodo: NodoConsulta): Observable<TablaDinamicaResultado> {
  return this.bloques
    .tablaRegularCon(COD_CARTERA_REPO.estructuraDesembolsos, this.paramsConFecha(nodo))
    .pipe(map(aplicarEstilosEstructuraDesembolsos));
}
```

`tablaRegularCon` aplica `mapearTablaRegular`, que ya parsea el `headers`
serializado y arma los KPIs si el reporte declara `meta1`.

**Ojo con los parámetros**: este motor no tiene un juego común. Carterización
manda `tipcod`/`codrel`/`fecha`, otros `tip_cod`/`cod_rel`/`fec`, y alguno no
manda ninguno. Cada service pone los suyos, y por eso el nombre correcto de cada
parámetro es parte de lo que se documenta en `constantes/`.

### El componente

```html
<app-tabla-dinamica
  [columnas]="tabla().columnas"
  [filas]="tabla().filas"
  [fondoDinamico]="true"
/>
```

---

## 5. Las cuatro cosas que hay que hacer a mano

El backend no manda todo resuelto. Esto es lo que agrega el frontend, y dónde va
cada pieza.

### a. Ocultar columnas

El legado descarta las columnas marcadas como ocultas. Va en `utils/`:

```typescript
export function columnasVisibles(headers: string | undefined): ColumnaDinamica[] {
  if (!headers) return [];
  const todas = JSON.parse(headers) as (ColumnaDinamica & { cellStyle?: { display?: string } })[];
  return todas.filter((h) => h.cellStyle?.display?.toLowerCase() !== 'none');
}
```

### b. Semáforos por columna

El backend manda la señal (`-1`, `0`, `1`) en una columna de control oculta. El
mapa columna-visible → columna-de-control va en `constantes/`:

```typescript
export const SEMAFOROS_CMG_CARTERA: Readonly<Record<string, string>> = {
  '9': '8', '11': '10', '13': '12',
};
```

y el marcado, en `utils/`, con `conColumnasSemaforo()`. La tabla dibuja el punto
(`pi-circle-fill`) con los colores del sistema.

Cuando la señal **no viene del backend** hay que calcularla —como en Ranking
Comercial, que compara cada avance contra el `Timing` del mes— y esa función
también va en `utils/`.

### c. Columnas fijas

Algunos reportes ignoran las cabeceras del payload y usan las suyas, porque el
legado hace lo mismo. Esas columnas van en un archivo propio dentro de
`models/`, por ejemplo `ranking-comercial.columnas.ts`, y el service las
sustituye:

```typescript
.pipe(map(({ filas }) => ({ columnas: COLUMNAS_RANKING_COMERCIAL, filas: filas.map(conSemaforos) })));
```

### d. Coloración condicional de celda

`cellStyleFn` recibe el valor y la fila entera y devuelve estilo. La escala de
colores va en `constantes/` y la función en `utils/`. Ejemplo real: la fila de
distribución porcentual de Estructura de Desembolsos, donde cada celda se pinta
según el puesto de su valor dentro de su grupo de columnas
(`estructura-desembolsos.util.ts`).

Para el caso simple —verde si el número es positivo, rojo si es negativo—
`<app-tabla-dinamica>` ya lo trae: `[fondoDinamico]="true"`.

---

## 6. Tarjetas KPI

Muchos reportes traen sus KPIs junto a la tabla, de tres formas distintas:

- En `resultado.meta1` — `mapearTablaRegular` los arma solo.
- En la **fila de totales** de la propia tabla (casi siempre la fila 0). Va en
  `models/`, como `kpisDeFilaTotal()`.
- En **filas de índice fijo**, porque el legado las lee así. Los índices van en
  `constantes/` (`FILAS_TARJETAS_CMG`) y el armado en `utils/`.

El estándar visual de las tarjetas está en
[`05-guia-estilos-kpis-reportes.md`](./05-guia-estilos-kpis-reportes.md).

---

## 7. Receta corta

Para una tabla nueva:

1. `cod_rep` en `constantes/`, con la ruta del legado y el host.
2. Elegí el motor: si el reporte vive en el `repositorio`, es `table.regular`;
   si cuelga de un host `cra-*`, es el mixto. **Lo decide el host, no el mapa.**
3. Método en el service: una llamada a `BloqueReporteService`.
4. Si hace falta ocultar columnas, marcar semáforos, fijar cabeceras o pintar
   celdas → `utils/`, con su configuración en `constantes/`.
5. Componente con `<app-tabla-reporte>` o `<app-tabla-dinamica>`.
6. Tests: unitario del mapeo y del componente.

## 8. Errores frecuentes

| Síntoma | Causa |
|---|---|
| HTTP 500 `Resultado vacio para: regularData` | El bloque no devolvió filas. Usá `regularTolerante()`, que absorbe la respuesta del servidor pero deja pasar la caída de red. |
| HTTP 500 al pedir un reporte que en el mapa figura `REGULAR` | El host no lee `reportType`. Probá `regularExacto()`. |
| Tabla vacía en un reporte paginado | Falta `pagen` o el nodo completo: usá `regularPaginado()`. |
| El reporte tarda muchísimo | Es lo esperado en los de data masiva y **ya no se corta**: el interceptor no impone timeout (ver [`07-rendimiento-legacy-vs-host.md`](./07-rendimiento-legacy-vs-host.md)). Marcalo con `regularLento()` para que se sepa que es de los que tardan. |
| Columnas corridas a partir de una | Un `colspan` de más en el encabezado; revisá las columnas ocultas. |
| El gráfico o la tabla salen en blanco | El payload venía en `data[0]` y se leyó solo `headers`, o al revés. |
