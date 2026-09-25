# Estándar de reportes

Reglas visuales que **todo reporte** cumple, para que ninguno se vea distinto al de al lado. Salen de
comparar pantalla por pantalla contra el legado STG; si un reporte nuevo no las cumple, es un bug.

El contrato detallado de cada componente está en su `README.md` junto al código; esto es la regla.

## 1. Franja de filtros

La franja (`ventana-filtros`) se arma con **tarjetas hermanas de vidrio** (`.mis-baldosa`), nunca
con controles sueltos.

| Qué | Cómo | Ancho |
|---|---|---|
| Filtro de jerarquía | `<app-hier-selector>` — trae su propia tarjeta | Todo el ancho (default) |
| Filtros propios del reporte | Dentro de `<app-grupo-filtros>` | Todo el ancho (default) |

```html
<div ventana-filtros class="flex flex-col gap-3">
  <app-hier-selector [paramsHier]="paramsHier" (nodoSeleccionado)="onNivel($event)" (error)="onErrorJerarquia()" />
  <app-grupo-filtros>
    <app-select-filtro etiqueta="Tipo" [opciones]="opcionesTipo" [(valor)]="tipo" />
  </app-grupo-filtros>
</div>
```

- **Ancho completo por defecto.** Las dos tarjetas ocupan todo el ancho de la franja, así quedan
  alineadas una sobre otra. `[anchoCompleto]="false"` las ajusta al contenido; usalo solo con motivo.
- **"Limpiar" va junto al último nivel** de la jerarquía, no empujado al borde derecho.
- **Controles:** `<app-select-filtro>` y `<app-input-filtro>`. Un `span` + `p-select` a mano sobre
  opciones `{ id, desc }` es exactamente `app-select-filtro`: no se repite. Si un control no encaja
  (fecha, asesor con buscador), su etiqueta usa el mismo estilo:
  `text-[9.5px] font-bold text-[var(--mis-text-secondary)] uppercase tracking-wider`.
- **Filtros dentro de pestañas** también van en `<app-grupo-filtros>`.
- **Ya resuelto por el armazón:** `app-reporte-simple` y `app-detalle-reasignado` envuelven su slot
  `[filtros]` en la tarjeta. Ahí se proyectan los controles sin envolverlos otra vez.
- Una tarjeta vacía (todo su contenido tras un `@if` en falso) se oculta sola.

## 2. Tablas

- **Resaltado de fila al pasar el cursor, siempre.** Como en el legado. Las cuatro tablas
  compartidas (`app-tabla-reporte`, `app-tabla-dinamica`, `app-data-table`, `app-editable-table`)
  ya lo traen con `[rowHover]="true"`. Un `p-table` propio dentro de un reporte tiene que llevarlo
  también; mejor aún, usar una de las compartidas.
- El color sale del token `--mis-table-row-hover-bg` (claro y oscuro en `theme/tokens.css`),
  conectado en `theme/mis-theme.ts` (`datatable.row.hoverBackground`). Es más marcado que
  `--mis-hover-bg` a propósito: ese es el de menús y listas, y en una tabla no se notaba. Para
  ajustar la intensidad se toca el token, no cada tabla.
- La tabla va en su tarjeta: `<div class="mis-card p-3 overflow-x-auto">`.
- **16 filas visibles como máximo, y nunca más del 62 % del alto de la ventana.** Pasado eso la
  tabla saca su propio scroll vertical y el encabezado queda fijo; el panel no scrollea. Lo
  resuelven las cuatro tablas compartidas con la directiva `appMaxFilas`
  (`shared/ui/tablas/max-filas.directive.ts`), que mide hasta el pie de la fila 16 y aplica el tope
  `FRACCION_MAX_ALTO_VENTANA`. Un `p-table` propio lleva `appMaxFilas` y `[scrollable]="true"`; no se fija un
  `scrollHeight` en píxeles.
- **El paginador es parte de la tabla**: va dentro de la misma tarjeta, pegado al pie de la tabla
  (como el `mat-paginator` del legado), nunca suelto debajo de ella.

### Formato de los números

**El formato lo decide el backend, no la pantalla.** Cada columna trae `format` y
`app-tabla-reporte` lo respeta tal como lo hacía el legado:

| Campo | Qué es | Ejemplo |
|---|---|---|
| `type` | `number`, `percent`, `traffic-light`, `string` | `"percent"` |
| `mode` | Decimales, en notación `digitsInfo` de `DecimalPipe`: `{enteros}.{mín}-{máx}` | `".0-0"` montos sin decimales · `"1.1-2"` porcentajes con 1 a 2 |
| `unit` | Unidad detrás del número | `"pbs"` en *Var. TAPP Mes/Stock* → `7 pbs` |

- Montos: sin decimales (`".0-0"`) y con separador de miles. Porcentajes: hasta 2 decimales.
- **Nunca** redondear ni cortar decimales en el servicio o en la plantilla del reporte: si un
  reporte se ve con decimales de más, el arreglo va en `formatear()` de `app-tabla-reporte` (que
  lee `mode`/`unit`), no en un parche por reporte. Si el backend no manda `mode`, se usan los
  decimales por defecto (número hasta 3, porcentaje 1).

### Tablas anchas

Una tabla de muchas columnas no debe sacar scroll horizontal en escritorio: se usa
`[ajustarAncho]="true"` en `app-tabla-reporte`, que ignora los anchos fijos del backend y angosta
las columnas **haciendo saltar de línea los encabezados, no los datos**:

- **Encabezados**: saltan de línea, salvo el de la primera columna (*Descripción*).
- **Filas**: ninguna celda de datos salta de línea, sea número, porcentaje o texto. `-1,083,623`
  o `-18 pbs` en dos renglones no se leen, y el backend no siempre marca como `number` una columna
  numérica. Cada columna queda al menos tan ancha como su dato más largo.

El contenedor conserva `overflow-x-auto` solo como respaldo para pantallas angostas. Ejemplos:
*Captaciones por Canal* (18 columnas) y *Panel Operaciones*.

### Drill down (bajar de nivel desde la tabla)

Cuando las filas de la tabla son niveles de la jerarquía (territorios, agencias…), la
descripción de cada fila es un enlace que baja a ese nivel, como en el legado.

**Dos modos**, según lo que pida el reporte:

| Modo | Filtro de jerarquía | Cómo se sube | Ejemplos |
|---|---|---|---|
| **Navegación por la tabla** (preferido) | Oculto | Migas `<app-ruta-jerarquica>` | *Cartera Agrícola*, *Vinculación Cartera* |
| Drill down como atajo | Visible | Los desplegables o "Limpiar" | *Gestión Pasivo Comercial* |

#### Cómo se integra (modo navegación por la tabla)

1. **Selector oculto en el cuerpo**, no en `ventana-filtros`: sin filtros visibles la ventana no
   pinta ese slot y el selector no existiría. Solo resuelve el nodo inicial autorizado, carga las
   opciones del nivel siguiente y emite la ruta.

   ```html
   <app-window-panel titulo="…" [permitirActualizar]="false">
     <app-hier-selector
       class="hidden"
       [paramsHier]="paramsHier"
       (nodoSeleccionado)="onNivelSeleccionado($event)"
       (rutaSeleccionada)="onRutaSeleccionada($event)"
       (error)="onErrorJerarquia()"
     />
   ```

2. **Migas sobre la tabla** con el componente compartido — nunca armadas a mano:

   ```html
   <app-ruta-jerarquica [ruta]="rutaJerarquica()" etiqueta="Ruta de …" (irANivel)="volverANivel($event)" />
   ```

   Se ven en todos los tamaños (saltan de línea si la ruta es larga). **No hay botón "Volver"**:
   las migas ya son la forma de subir.

3. **La tabla con la primera columna clicable**:

   ```html
   <app-tabla-dinamica … [columnasClicables]="columnasDrillDown()" (celdaSeleccionada)="onCeldaSeleccionada($event)" />
   ```

4. **En el componente** (ver `vinculacion-cartera.component.ts`):
   - `selectorJerarquia = viewChild(HierSelectorComponent)` y `rutaJerarquica = signal<HierarquiaNodo[]>([])`.
   - La columna clicable es la **primera hoja** de las columnas del payload (la etiqueta de la fila).
   - `columnasDrillDown` es un `computed` que devuelve esa columna **solo si alguna fila tiene un
     nodo hijo**: si no, no se ofrece un enlace que no hace nada.
   - `nodoHijo(fila)`: primero `nodoDeFila(fila, claveEtiqueta)` (`reportes/utils/nodo-fila.util.ts`,
     acepta `htipcod` + `cod_rel` o `htipcod` + `hcodrel`); si la fila no trae esas claves, **por
     nombre** con `selectorJerarquia()?.opcionPorDescripcion(texto)`, que busca entre las opciones
     ya cargadas sin distinguir mayúsculas, tildes ni espacios. Descarta el nivel actual (la fila de
     totales).
   - Al hacer clic: `seleccionarNodo(nodo)` del selector, que emite el nodo y la ruta nueva. Si el
     nodo no está entre sus opciones, se agrega a la ruta y se consulta igual.
   - `volverANivel(i)`: `seleccionarNodo(ruta[i])`, o si no está, recortar la ruta y consultar.

5. **Pruebas**: clicable solo con nodo hijo, baja al hacer clic, ignora la fila de totales y las
   otras columnas, baja por nombre cuando la fila no trae claves, y una miga vuelve y recorta la
   ruta (ver `vinculacion-cartera.component.spec.ts`).

#### Reglas

- Nada de enlaces muertos: la columna solo es clicable si hay a dónde bajar.
- La fila de totales (el nivel actual) no baja.
- Se baja y se sube **siempre por el selector** (`seleccionarNodo`), para que la jerarquía cargada
  y la ruta queden en sincronía.
- En el modo con filtro visible no hacen falta migas: los desplegables muestran el nivel y
  "Limpiar" vuelve a la raíz.

## 3. Semáforo de indicadores

El backend manda junto a cada indicador un `style_<campo>`: `1` verde (cumple), `0` ámbar
(alerta), `-1` rojo (riesgo). **El rojo es la regla del legado, no un error**: significa que no
llega a la meta.

- En celdas lo aplica solo `app-tabla-reporte`.
- Fuera de una tabla (chips, tarjetas) se usa `reportes/utils/semaforo.util.ts`:
  `semaforo(valor)` da `1 | 0 | -1 | null`, y `severidadSemaforo(valor)` da la `severity` de
  PrimeNG (`success` / `warn` / `danger`, o `info` si no hay dato).

## 4. Chips informativos

Toda nota corta que acompaña a una tabla va como **chip** (`<app-chip-informativo>`, en
`shared/ui/chip-informativo`) justo encima de la tabla, nunca como texto suelto:

- **Unidad de la tabla**, p. ej. *Expresado en PEN y %*:
  `<app-chip-informativo texto="Expresado en PEN y %" />`. En el Panel del asesor va en el campo
  `chip` del bloque (`BloquePanelAsesor`), no en `titulo`: no es un título.
- **Indicador de una pestaña**, p. ej. el cumplimiento de meta en *Monitor Metas Desembolso*: va
  dentro de esa pestaña, sobre sus tablas, con la severidad del semáforo
  (`[severidad]="severidadSemaforo(...)"`). No como tarjeta KPI grande arriba de las pestañas, que
  no dice a cuál pertenece.

Lo que **no** es chip: el título de una tabla ("Cero Cuota", "Ahorro Programado") y las notas al
pie o leyendas (`nota` de los bloques, `content.lower` del legado), que van debajo de la tabla.

## 5. Tarjetas KPI contra meta

Los KPIs de encabezado que se comparan contra una meta o un período anterior (p. ej. *CMG
Cartera*, diaria y mensual) usan `<app-tarjeta-meta>` (`reportes/ui/tarjeta-meta`), con la
disposición del legado:

- **Izquierda**: el valor grande; debajo, la referencia en color primario (meta, TAPP mínima, mes
  anterior); al pie, el nombre del indicador.
- **Derecha**: el aro de cumplimiento (rojo bajo 95 %, ámbar hasta 100 %, verde al superar la
  meta) o, si no hay cumplimiento, la variación con su flecha (verde si sube, rojo si baja).
- Los textos de la referencia son los del legado tal cual (p. ej. en *Ope. Desembolsada* solo la
  meta, sin "Meta").

Un selector que cambia **qué se mira** en todo el reporte (la fase *Total / Programas del
Gobierno / Sin Programas de Gobierno*) va como **pestañas bajo las tarjetas**, como en el legado,
no como desplegable en la franja de filtros.

## Cómo se hace cumplir

Estas reglas no dependen de acordarse: `npm run audit:governance` (y `npm run verify`, que corre en
CI) falla si un reporte las rompe.

| Regla del auditor | Qué exige |
|---|---|
| `tabla-con-hover` | Todo `<p-table>` de reportes y de las tablas compartidas lleva `[rowHover]="true"` |
| `filtros-en-baldosa` | Un reporte con filtros propios los pone en `<app-grupo-filtros>` (o usa un armazón que ya lo hace) |
| `nota-de-unidad-en-chip` | Ningún "Expresado en…" como texto suelto: va en `<app-chip-informativo>` |
| `drill-down-con-migas` | Un reporte con el selector de jerarquía oculto usa `<app-ruta-jerarquica>`, no migas armadas a mano |

El formato de números (`mode` / `unit`) lo cubren las pruebas de `tabla-reporte.component.spec.ts`
con valores reales de *Captaciones por Canal*. Las reglas viven en
`governance/scripts/validar-gobernanza.mjs`; una regla nueva de este estándar se agrega ahí, no
solo en este documento.

## Ver también

- [Liquid Glass del Host](./liquid-glass.md) — el material de `.mis-baldosa` y `.mis-card`
- [Guía de KPI](./kpi-guidelines.md)
- `src/app/shared/ui/formularios/README.md` — `app-grupo-filtros`, `app-select-filtro`, `app-input-filtro`
- `src/app/shared/ui/hier-selector/README.md`
- `src/app/shared/ui/tablas/README.md`
