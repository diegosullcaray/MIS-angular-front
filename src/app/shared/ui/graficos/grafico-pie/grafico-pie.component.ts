import { Component, computed, inject, input, output } from '@angular/core';
import { GraficoBaseComponent } from '../grafico-base/grafico-base.component';
import { ThemeService } from '../../../services/theme.service';
import type { PorcionGrafico } from '../models/grafico-comun.model';
import { opcionesPie } from '../utils/highcharts-factory.util';

/** Torta/dona a partir de una lista de porciones (`nombre`, `valor` y color opcional). */
@Component({
  selector: 'app-grafico-pie',
  standalone: true,
  imports: [GraficoBaseComponent],
  template: `
    <app-grafico-base
      [opciones]="opciones()"
      [titulo]="titulo()"
      (puntoSeleccionado)="porcionSeleccionada.emit($event)"
    />
  `,
  styles: [':host { display: flex; flex-direction: column; height: 100%; min-height: 0; } app-grafico-base { flex: 1 1 auto; min-height: 0; }'],
})
export class GraficoPieComponent {
  private readonly tema = inject(ThemeService);

  readonly porciones = input.required<readonly PorcionGrafico[]>();
  readonly titulo = input('');
  /** Para gráficos embebidos en tarjetas que ya traen su propio fondo. */
  readonly fondoTransparente = input(false);
  /** Vacía el centro: la torta pasa a ser dona (legado `innerSize: '65%'`). */
  readonly dona = input(false);

  /** Emite el nombre de la porción clickeada. */
  readonly porcionSeleccionada = output<string>();

  protected readonly opciones = computed(() =>
    opcionesPie(this.porciones(), this.tema.oscuro(), {
      fondoTransparente: this.fondoTransparente(),
      dona: this.dona(),
    })
  );
}
