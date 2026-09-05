# Formularios

Controles de formulario genéricos: la barra de filtros de un reporte se arma con estos, para que
todas las pantallas se vean y se comporten igual en vez de que cada una repita su `<span>` de
etiqueta más el control.

## `<app-select-filtro>`

Desplegable de filtro con su etiqueta encima. Es un envoltorio fino sobre `p-select` que fija la
forma de las opciones (`{ id, desc }`) y el estilo de los filtros del Host, para que todos los
reportes se vean igual.

```typescript
// El número de `../` depende de dónde viva tu componente; no hay alias de rutas en el proyecto.
import { SelectFiltroComponent } from '…/shared/ui/formularios/select-filtro/select-filtro.component';
import type { OpcionFiltro } from '…/shared/ui/formularios/opcion-filtro.model';

@Component({
  imports: [SelectFiltroComponent],
  // ...
})
export class MiReporte {
  protected readonly opciones: OpcionFiltro<number>[] = [
    { id: 1, desc: 'TRAMO' },
    { id: 2, desc: 'PLAZO' },
  ];
  protected readonly tipo = signal(1);
}
```

```html
<app-select-filtro etiqueta="Agrupar por" [opciones]="opciones" [(valor)]="tipo" />
```

`valor` es un `model()`, así que va con banda doble (`[(valor)]`) y acepta un signal escribible
directo. El tipo del `id` se infiere de las opciones: con `OpcionFiltro<number>` el `valor` es
`number`.

| Input | Tipo | Por defecto | Para qué |
|---|---|---|---|
| `etiqueta` | `string` | — | **Requerido.** Label sobre el desplegable |
| `opciones` | `OpcionFiltro<T>[]` | — | **Requerido** |
| `ancho` | `string` | `'w-44'` | Clase de Tailwind para el ancho |
| `valor` | `model<T>` | — | **Requerido.** Banda doble |

## `OpcionFiltro`

```typescript
interface OpcionFiltro<T extends string | number = string> {
  id: T;
  desc: string;
}
```

Acá vive solo el **tipo**. Los catálogos concretos de cada módulo (canales, productos, segmentos…)
se quedan en su módulo — ver `reportes/models/filtros.model.ts`, que los define y reexporta este
tipo. Un catálogo de negocio no tiene por qué vivir en shared.

## `<app-input-filtro>`

Campo de texto de filtro, hermano de `<app-select-filtro>` y con la misma forma de API.

```html
<div class="flex flex-wrap items-end gap-3">
  <app-input-filtro etiqueta="Unidad" placeholder="Buscar unidad…" [(valor)]="unidad" />
  <app-select-filtro etiqueta="Territorio" [opciones]="territorios()" [(valor)]="territorio" ancho="w-52" />
</div>
```

| Input | Tipo | Por defecto | Para qué |
|---|---|---|---|
| `etiqueta` | `string` | — | **Requerido.** Label sobre el campo; también es su `aria-label` |
| `placeholder` | `string` | `''` | Texto de ayuda dentro del campo |
| `ancho` | `string` | `'w-44'` | Clase de Tailwind para el ancho |
| `valor` | `model<string>` | `''` | Banda doble |

Filtra en cada tecla, porque trabaja sobre data ya cargada en el cliente. Para filtrar contra el
backend conviene la búsqueda manual de [`<app-data-table>`](../data-table/README.md), que espera
al Enter o al botón.
