# Gráficas compartidas

Toda gráfica del Host se dibuja con **Highcharts**, desde acá. Los módulos de negocio no importan
Highcharts ni arman un `Highcharts.Options`: le pasan data simple a un componente de esta carpeta.

```
graficos/
├── grafico-base/
│   ├── grafico-base.component.ts     ← renderizador puro (agnóstico)
│   ├── grafico-base.component.html
│   └── grafico-base.component.css
├── grafico-pie/
│   └── grafico-pie.component.ts      ← pre-configurado para donas/torta
├── grafico-mixto/
│   └── grafico-mixto.component.ts    ← pre-configurado para barras + líneas
├── models/
│   └── grafico-comun.model.ts        ← interfaces (series, categorías, porciones)
└── utils/
    ├── highcharts-factory.util.ts    ← funciones que arman el objeto Highcharts
    └── paleta-colores.util.ts        ← colores corporativos de Financiera Confianza
```

## Cómo funciona

Cada capa tiene una única responsabilidad, para que nada se recicle "sucio":

- **`grafico-base` (el lienzo tonto).** No sabe nada de reportes, ni de créditos, ni de
  captaciones. Recibe un `Highcharts.Options` por `@Input()` y lo dibuja; redibuja cuando le
  llegan opciones nuevas y destruye la instancia al salir. Lo único que agrega es el click de
  punto, que emite como `puntoSeleccionado` para que la fábrica no tenga que conocer al
  componente.
- **Los componentes específicos (`grafico-mixto`, `grafico-pie`).** Envuelven al base. Reciben
  data simple (`[datos]="bloque"`, `[porciones]="..."`), leen el tema y llaman a la fábrica.
  Son los únicos que dependen del `ThemeService` (`shared/services/`).
- **Las utilidades.** `highcharts-factory` centraliza lo repetitivo: márgenes, ejes, tooltip
  corporativo, formateo de importes y la elección de la forma del gráfico. `paleta-colores`
  tiene los colores y los tokens de tema resueltos a hexadecimal (Highcharts no resuelve
  variables CSS dentro de su configuración).

## Flujo de datos

1. El componente del reporte hace la petición HTTP y obtiene la data pura (JSON).
2. La mapea a `BloqueGrafico` (categorías + series) o a `PorcionGrafico[]`.
3. En su HTML llama a `<app-grafico-mixto [datos]="bloque" />`.
4. `app-grafico-mixto` usa la fábrica para crear las `Highcharts.Options` y se las pasa
   internamente a `<app-grafico-base [opciones]="opts" />`.

Si mañana hay que cambiar el estilo de todas las barras del sistema, se toca
`highcharts-factory.util.ts` y se actualizan todos los reportes, sin entrar a ningún módulo.

## Uso

```typescript
// El número de `../` depende de dónde viva tu componente; no hay alias de rutas en el proyecto.
import { GraficoMixtoComponent } from '…/shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import type { BloqueGrafico } from '…/shared/ui/graficos/models/grafico-comun.model';

@Component({
  imports: [GraficoMixtoComponent],
  // ...
})
export class MiReporte {
  protected readonly grafico = signal<BloqueGrafico>({
    titulo: 'Saldo por cultivo',
    categorias: ['ARROZ', 'CAFÉ', 'MAÍZ'],
    series: [
      { nombre: 'Saldo', datos: [500_000, 320_000, 180_000] },
      { nombre: '% Vencido', datos: [3.2, 5.1, 2.4] },
    ],
  });
}
```

```html
<!-- El alto lo fija el contenedor; el gráfico ocupa el 100 %. -->
<div class="mis-card p-3 h-[360px]">
  <app-grafico-mixto [datos]="grafico()" (puntoSeleccionado)="abrirDetalle($event)" />
</div>
```

`<app-grafico-mixto>` acepta:

| Input | Por defecto | Para qué |
|---|---|---|
| `datos` | — | `BloqueGrafico`: título, categorías y series |
| `tipo` | `auto` | `barra` (horizontal), `columna` (vertical), `linea`, o `auto` |
| `formato` | `soles` | Formato del tooltip: importe en soles o número pelado |
| `fondoTransparente` | `false` | Para tarjetas que ya traen su propio fondo |

Con `tipo="auto"` la forma se infiere de las series, replicando qué config del legado le tocaba
a cada bloque: una sola serie → barra horizontal simple; una métrica base + N series con "%" en
el nombre → barra horizontal con splines sobre el eje secundario; dos o más métricas base →
columnas verticales con splines.

`<app-grafico-pie>` recibe `[porciones]` (`{ nombre, valor, color? }[]`) y un `[titulo]`
opcional; emite `porcionSeleccionada`.

Cuando el título ya lo pinta la tarjeta contenedora, se pasa `titulo: ''` en el bloque y el
gráfico no dibuja encabezado.
