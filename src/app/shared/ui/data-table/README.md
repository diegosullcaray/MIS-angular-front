# `<app-data-table>`

Tabla genérica sobre `p-table` de PrimeNG. A partir de un array de `columns` arma el encabezado, el
orden por columna y el paginador; opcionalmente un buscador en el `caption` y una fila de filtros
por columna.

Dos cosas que la diferencian de un `p-table` pelado:

- **La búsqueda es manual.** Filtra al presionar "Buscar" o Enter, no en cada tecla — las tablas de
  reportes traen miles de filas.
- **La fila de filtros arranca oculta.** Se abre con "Filtrar"; al cerrarla se limpian los filtros
  aplicados.

## Uso

```typescript
// El número de `../` depende de dónde viva tu componente; no hay alias de rutas en el proyecto.
import { DataTableComponent } from '…/shared/ui/data-table/data-table.component';
import { DataTableCellDirective } from '…/shared/ui/data-table/data-table-cell.directive';
import type { DataTableColumn } from '…/shared/ui/data-table/data-table.model';

@Component({
  imports: [DataTableComponent, DataTableCellDirective],
  // ...
})
export class MiComponente {
  protected readonly columnas: DataTableColumn[] = [
    { field: 'HDESCLI', header: 'Cliente' },
    { field: 'HCTACLI', header: 'Cuenta', width: '9rem', mobileVisible: false },
    { field: 'HETPROD', header: 'Estado', filterType: 'dropdown',
      dropdownOptions: [{ label: 'Vigente', value: 'VIGENTE' }, { label: 'Vencido', value: 'VENCIDO' }] },
    { field: 'HCAPMON', header: 'Capital', align: 'right', filterType: 'number' },
  ];

  protected readonly busqueda = ['HDESCLI', 'HCTACLI'];
}
```

```html
<app-data-table
  [columns]="columnas"
  [data]="filas()"
  [loading]="cargando()"
  [searchFields]="busqueda"
  searchPlaceholder="Buscar por cliente o cuenta..."
  emptyMessage="No se encontraron clientes para este cultivo."
/>
```

### Celdas con plantilla propia

Un `<ng-template appDataTableCell="<field>" let-row>` proyectado dentro reemplaza el render de esa
columna. `row` es la fila completa:

```html
<app-data-table [columns]="columnas" [data]="filas()">
  <ng-template appDataTableCell="HDESCLI" let-row>
    <span class="font-medium text-[var(--mis-text-primary)]">{{ row.HDESCLI }}</span>
  </ng-template>

  <ng-template appDataTableCell="HCAPMON" let-row>
    <span class="font-mono">{{ row.HCAPMON | number: '1.2-2' }}</span>
  </ng-template>
</app-data-table>
```

Sirve también para columnas que no son un dato: definí la columna con un `field` propio (y
`sortable: false`) y renderizá los botones en su plantilla.

## API del componente

| Input | Tipo | Por defecto | Para qué |
|---|---|---|---|
| `columns` | `DataTableColumn[]` | — | **Requerido** |
| `data` | `T[]` | — | **Requerido** |
| `loading` | `boolean` | `false` | Estado de carga de `p-table` |
| `rows` | `number` | `10` | Filas por página |
| `rowsPerPageOptions` | `number[]` | `[10, 25, 50]` | Opciones del paginador |
| `scrollHeight` | `string` | — | Alto con scroll interno (ej. `'60vh'`) |
| `emptyMessage` | `string` | `'No se encontraron registros.'` | Sin resultados |
| `emptyHint` | `string` | `'Ajusta la búsqueda…'` | Segunda línea del estado vacío |
| `searchFields` | `string[]` | `[]` | Campos donde busca; **vacío oculta el buscador** |
| `searchPlaceholder` | `string` | `'Buscar...'` | Placeholder del buscador |
| `showRefreshButton` | `boolean` | `false` | Botón "Actualizar" en el caption |

| Output | Cuándo |
|---|---|
| `refrescar` | Clic en "Actualizar" — el componente no recarga nada por su cuenta |

## `DataTableColumn`

| Campo | Tipo | Para qué |
|---|---|---|
| `field` | `string` | Clave del dato en la fila, o un id propio para columnas sin dato |
| `header` | `string` | Texto del encabezado |
| `align` | `'left' \| 'center' \| 'right'` | Alineación del contenido |
| `width` | `string` | Ancho fijo (ej. `'7rem'`) |
| `sortable` | `boolean` | Por defecto `true` |
| `filterType` | `'text' \| 'number' \| 'dropdown' \| 'date'` | Sin esto, la columna no tiene filtro propio |
| `dropdownOptions` | `{ label, value }[]` | Requerido con `filterType: 'dropdown'` |
| `filterPlaceholder` | `string` | Placeholder del filtro de esa columna |
| `mobileVisible` | `boolean` | Por defecto `true`; `false` la oculta bajo 640px |

Cómo compara cada `filterType`: `text` por substring sin distinguir mayúsculas, `number` por
igualdad numérica, `dropdown` por identidad, y `date` por día calendario (ignora la hora, y acepta
tanto `Date` como texto ISO).

Las celdas vacías (`null`, `undefined`, `''`) se muestran como `-`.
