import { TestBed } from '@angular/core/testing';
import { GraficoRadarComponent } from './grafico-radar.component';

describe('GraficoRadarComponent', () => {
  it('arma una serie por cada entrada y respeta los ejes y el máximo', () => {
    const fixture = TestBed.createComponent(GraficoRadarComponent);
    fixture.componentRef.setInput('datos', {
      ejes: ['A', 'B', 'C'],
      maximo: 100,
      series: [
        { nombre: 'Asesor', valores: [80, 60, 90], color: '#0A4681' },
        { nombre: 'Promedio', valores: [70, 65, 60], color: '#F28F16', discontinua: true },
      ],
    });
    fixture.detectChanges();

    const opciones = fixture.componentInstance['opciones']();
    expect((opciones.series ?? []).length).toBe(2);
    expect((opciones.xAxis as { categories: string[] }).categories).toEqual(['A', 'B', 'C']);
    expect((opciones.yAxis as { max: number }).max).toBe(100);
  });
});
