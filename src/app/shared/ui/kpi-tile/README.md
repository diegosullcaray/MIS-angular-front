# `<app-kpi-tile>`

Tarjeta de indicador: una etiqueta, el valor como protagonista y la variación contra un periodo
con nombre. Es la pieza de las filas de KPIs que encabezan varios reportes.

Sigue el contrato de un *stat tile*, y de ahí salen sus tres reglas:

- **Una sola etiqueta.** Nada de un rótulo arriba y otro explicando el valor: el riel de acento y
  la jerarquía tipográfica hacen ese trabajo.
- **El valor va compacto.** `4.2 M` se lee de un vistazo; `4,235,891.00` hay que contarlo.
- **La variación lleva signo, flecha y periodo.** El color no puede ser el único portador del
  estado —quien no distingue verde de rojo se queda sin el dato—, así que siempre hay una flecha.
  Y una variación sin periodo no significa nada.

## Uso

```typescript
// El número de `../` depende de dónde viva tu componente; no hay alias de rutas en el proyecto.
import { KpiTileComponent } from '…/shared/ui/kpi-tile/kpi-tile.component';

@Component({
  imports: [KpiTileComponent],
  // ...
})
```

```html
<div class="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
  @for (kpi of kpis(); track kpi.producto) {
    <app-kpi-tile
      [etiqueta]="kpi.producto"
      [valor]="kpi.saldo"
      unidad="S/"
      [variacion]="kpi.variacion"
      periodo="vs. mes anterior"
    />
  }
</div>
```

Cuando subir es *malo* —mora, reclamos, salidas— hay que decirlo, o el verde y el rojo quedan al
revés:

```html
<app-kpi-tile etiqueta="Cartera en mora" [valor]="mora()" unidad="S/" [variacion]="varMora()" [subirEsBueno]="false" />
```

## API

| Input | Tipo | Por defecto | Para qué |
|---|---|---|---|
| `etiqueta` | `string` | — | **Requerido.** Qué mide la tarjeta; sin dos puntos al final |
| `valor` | `number` | — | **Requerido.** Se muestra abreviado |
| `unidad` | `string` | `''` | Prefijo del valor (ej. `S/`); vacío para conteos |
| `variacion` | `number \| null` | `null` | `null` oculta la línea del delta |
| `periodo` | `string` | `'vs. mes anterior'` | Contra qué se compara |
| `subirEsBueno` | `boolean` | `true` | `false` invierte los colores del delta |

## Cómo abrevia

| Valor | Se muestra |
|---|---|
| ≥ 1 000 000 | `4.2 M` |
| ≥ 10 000 | `12.9 K` |
| menor | `1,284` |

El corte de los miles está en 10 000 y no en 1 000 a propósito: `1.3 K` esconde precisión que a
esa escala todavía importa, y `1,284` entra igual de bien.

Un valor no finito se muestra como `—`, no como `NaN`.
