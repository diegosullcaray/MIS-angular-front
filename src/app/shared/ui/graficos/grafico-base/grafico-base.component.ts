import { Component, DestroyRef, ElementRef, effect, inject, input, output, viewChild } from '@angular/core';
// El build ESM de Highcharts 13 solo expone `default` en runtime, pero sus
// tipos son exports con nombre — de ahí la importación partida en dos.
import Highcharts from 'highcharts';
import type { Chart, Options, PointClickEventObject } from 'highcharts';

/**
 * Lienzo de Highcharts: recibe un `Options` ya armado y lo dibuja. Nada más.
 *
 * No sabe de reportes, ni de créditos, ni de captaciones: quien decide *qué* se dibuja es la
 * fábrica (`utils/highcharts-factory.util.ts`) a través de `<app-grafico-mixto>` /
 * `<app-grafico-pie>`. Acá solo vive lo común a cualquier gráfico: crear la instancia,
 * redibujar cuando cambian las opciones (incluido el cambio de tema, que llega como opciones
 * nuevas) y destruirla al salir.
 */
@Component({
  selector: 'app-grafico-base',
  standalone: true,
  imports: [],
  templateUrl: './grafico-base.component.html',
  styleUrl: './grafico-base.component.css',
})
export class GraficoBaseComponent {
  private readonly lienzo = viewChild.required<ElementRef<HTMLDivElement>>('lienzo');
  private chart: Chart | null = null;
  private pendiente: ReturnType<typeof setTimeout> | null = null;

  readonly opciones = input.required<Options>();
  /** Encabezado opcional; si viene vacío, el contenedor pone el suyo. */
  readonly titulo = input('');
  readonly subtitulo = input('');

  /** Emite la categoría (o el nombre de la porción) del punto clickeado. */
  readonly puntoSeleccionado = output<string>();

  constructor() {
    // Un único punto de dibujo: el efecto corre en el primer render y en cada cambio de
    // opciones. El timeout deja que el contenedor tenga tamaño antes de que Highcharts mida.
    effect(() => {
      const opciones = this.opciones();
      this.cancelarPendiente();
      this.pendiente = setTimeout(() => {
        this.pendiente = null;
        this.renderizar(opciones);
      }, 0);
    });

    inject(DestroyRef).onDestroy(() => {
      this.cancelarPendiente();
      this.destruirChart();
    });
  }

  private renderizar(opciones: Options): void {
    const el = this.lienzo().nativeElement;
    if (!el) return;

    this.destruirChart();
    this.chart = Highcharts.chart(el, this.conClick(opciones));
  }

  private cancelarPendiente(): void {
    if (this.pendiente === null) return;
    clearTimeout(this.pendiente);
    this.pendiente = null;
  }

  private destruirChart(): void {
    try {
      this.chart?.destroy();
    } catch {
      // Una instancia a medio crear (p. ej. sin SVG en jsdom) revienta al destruirse;
      // soltar la referencia alcanza para que la recoja el GC.
    }
    this.chart = null;
  }

  /** Engancha el click de punto sin que la fábrica tenga que conocer al componente. */
  private conClick(opciones: Options): Options {
    return {
      ...opciones,
      plotOptions: {
        ...opciones.plotOptions,
        series: {
          ...opciones.plotOptions?.series,
          point: {
            events: {
              click: (evento: PointClickEventObject) => {
                const punto = evento.point;
                const etiqueta = String(punto?.category ?? punto?.name ?? '');
                if (etiqueta) this.puntoSeleccionado.emit(etiqueta);
              },
            },
          },
        },
      },
    };
  }
}
