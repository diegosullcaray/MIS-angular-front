# `<app-list-skeleton>`

Skeleton pulsante con forma de tabla: una fila de encabezado y N filas de celdas de ancho variable.
Se muestra mientras cargan los datos, en lugar de un spinner, para que el layout no salte cuando
llega la respuesta.

**No reemplaza a una tabla compartida.** `app-tabla-reporte`, `app-tabla-dinamica`,
`app-data-table` y `app-editable-table` pintan su propio esqueleto dentro de su tarjeta con
`[cargando]` / `[loading]` (ver el [estándar de reportes](../../../../../governance/docs/components/estandar-reportes.md#2-tablas)).
Este componente es para lo que no es una de ellas: fichas, listas, tarjetas o un `p-table` propio.

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
  <!-- una ficha, una lista o un p-table propio: no una tabla compartida -->
  <app-resumen-cliente [datos]="resumen()" />
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

Las tablas compartidas ya traen su propio esqueleto: con ellas se enlaza `[cargando]` (o
`[loading]` en `<app-data-table>`) y este componente no hace falta.
