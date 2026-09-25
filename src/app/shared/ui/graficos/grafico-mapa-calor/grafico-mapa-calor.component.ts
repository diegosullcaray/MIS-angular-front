import { Component, computed, inject, input } from '@angular/core';
import Highcharts from 'highcharts/esm/highcharts.js';
import Heatmap from 'highcharts/esm/modules/heatmap.js';
import { ThemeService } from '../../../services/theme.service';
import type { MapaCalorGrafico } from '../models/grafico-comun.model';
import { GraficoBaseComponent } from '../grafico-base/grafico-base.component';

// En Highcharts 13 el módulo se auto-registra al importarse (su export por
// defecto es la instancia Highcharts extendida, no una función inicializadora).
void Heatmap;

@Component({
  selector: 'app-grafico-mapa-calor',
  standalone: true,
  imports: [GraficoBaseComponent],
  template: '<app-grafico-base [opciones]="opciones()" />',
  styles: [
    ':host { display: flex; height: 100%; min-height: 0; } app-grafico-base { flex: 1; min-height: 0; }',
  ],
})
export class GraficoMapaCalorComponent {
  private readonly tema = inject(ThemeService);
  readonly datos = input.required<MapaCalorGrafico>();

  protected readonly opciones = computed(() => {
    const datos = this.datos();
    const oscuro = this.tema.oscuro();
    const puntos = datos.valores.flatMap((fila, y) => fila.map((valor, x) => [x, y, valor]));

    return {
      chart: { type: 'heatmap', backgroundColor: 'transparent', marginTop: 50, marginBottom: 72 },
      title: {
        text: datos.titulo,
        style: { color: oscuro ? '#E8EEF9' : '#164D90', fontWeight: 'bold', fontSize: '14px' },
      },
      xAxis: { categories: datos.categoriasX, title: { text: 'Año de desembolso' } },
      yAxis: {
        categories: datos.categoriasY,
        title: { text: 'Estado' },
        reversed: datos.ejeYInvertido ?? true,
      },
      colorAxis: {
        min: 0,
        stops: [
          [0, '#ffffcc'],
          [0.2, '#d9f0a3'],
          [0.5, '#41b6c4'],
          [0.8, '#225ea8'],
          [1, '#081d58'],
        ],
      },
      legend: {
        align: 'right',
        layout: 'vertical',
        verticalAlign: 'top',
        y: 24,
        symbolHeight: 250,
        title: { text: 'Saldos (M S/)' },
      },
      tooltip: {
        formatter: function (this: Highcharts.Point & { value?: number }) {
          const x = Number(this.x ?? 0);
          const y = Number(this.y ?? 0);
          return `<b>${this.series.xAxis.categories[x]}</b> - <b>${this.series.yAxis.categories[y]}</b><br>Saldo: <b>${Number(this.value ?? 0).toFixed(2)} M</b>`;
        },
      },
      plotOptions: {
        series: {
          dataLabels: {
            enabled: true,
            formatter: function (this: Highcharts.Point & { value?: number }) {
              return Number(this.value ?? 0).toFixed(2);
            },
            style: { textOutline: 'none', fontSize: '10px' },
          },
        },
      },
      series: [
        { type: 'heatmap', name: 'Saldos', borderWidth: 2, borderColor: '#ffffff', data: puntos },
      ],
      credits: { enabled: false },
      accessibility: { enabled: false },
    } as Highcharts.Options;
  });
}
