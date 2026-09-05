# `<app-list-skeleton>`

Skeleton pulsante con forma de tabla: una fila de encabezado y N filas de celdas de ancho variable.
Se muestra mientras cargan los datos, en lugar de un spinner, para que el layout no salte cuando
llega la respuesta.

## Uso

```typescript
// El número de `../` depende de dónde viva tu componente; no hay alias de rutas en el proyecto.
import { ListSkeletonComponent } from '…/shared/ui/list-skeleton/list-skeleton.component';

@Component({
  imports: [ListSkeletonComponent],
  // ...
})
```

```html
@if (cargando()) {
  <app-list-skeleton />
} @else {
  <app-data-table [columns]="columnas" [data]="filas()" />
}
```

Ajustando la grilla a la tabla real, para que el salto al cargar sea mínimo:

```html
<!-- 8 filas × 4 columnas -->
<app-list-skeleton [rows]="[1, 2, 3, 4, 5, 6, 7, 8]" [cols]="[1, 2, 3, 4]" />
```

## API

| Input | Tipo | Por defecto | Para qué |
|---|---|---|---|
| `rows` | `number[]` | `[1, 2, 3, 4, 5]` | Una fila por elemento |
| `cols` | `number[]` | `[1, 2, 3, 4, 5]` | Una columna por elemento |

Los arrays se usan solo por su **largo** y como clave de `track`: el contenido no se muestra. Se
reciben como arrays y no como números porque el template itera con `@for` directamente sobre ellos.

`DataTableComponent` ya trae su propio estado de carga (`[loading]`), así que dentro de una
`<app-data-table>` este componente no hace falta.
