import { Component, computed, inject, input, output } from '@angular/core';
import { GraficoBaseComponent } from '../grafico-base/grafico-base.component';
import { ThemeService } from '../../../services/theme.service';
import type { BloqueGrafico, FormatoValor, TipoGraficoMixto } from '../models/grafico-comun.model';
import { opcionesMixto } from '../utils/highcharts-factory.util';

/**
 * Barras + líneas a partir de un `BloqueGrafico` (categorías y series, sin Highcharts a la vista).
 *
 * Cubre las tres formas del motor de reportes: barra horizontal simple, barra horizontal con
 * líneas de porcentaje y columnas con líneas. Con `tipo="linea"` sirve además para los evolutivos
 * de una sola métrica por serie.
 */
@Component({
  selector: 'app-grafico-mixto',
  standalone: true,
  imports: [GraficoBaseComponent],
  template: `
    <app-grafico-base
      [opciones]="opciones()"
      (puntoSeleccionado)="puntoSeleccionado.emit($event)"
    />
  `,
  styles: [':host { display: flex; flex-direction: column; height: 100%; min-height: 0; } app-grafico-base { flex: 1 1 auto; min-height: 0; }'],
})
export class GraficoMixtoComponent {
  private readonly tema = inject(ThemeService);

  readonly datos = input.required<BloqueGrafico>();
  /** Forma del gráfico; `auto` la infiere de las series (ver la fábrica). */
  readonly tipo = input<TipoGraficoMixto>('auto');
  /** Formato del tooltip: importes en soles (por defecto) o números pelados. */
  readonly formato = input<FormatoValor>('soles');
  /** Para gráficos embebidos en tarjetas que ya traen su propio fondo. */
  readonly fondoTransparente = input(false);
  /** Si las barras/columnas deben apilarse (stacking: 'normal'). */
  readonly apilado = input(false);

  /** Emite la categoría clickeada — abre el detalle del reporte que la escuche. */
  readonly puntoSeleccionado = output<string>();

  protected readonly opciones = computed(() =>
    opcionesMixto(this.datos(), this.tema.oscuro(), {
      tipo: this.tipo(),
      formato: this.formato(),
      fondoTransparente: this.fondoTransparente(),
      apilado: this.apilado() || Boolean(this.datos().apilado),
    })
  );
}
