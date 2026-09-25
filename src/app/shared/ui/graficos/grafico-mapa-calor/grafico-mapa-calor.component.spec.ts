import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import Highcharts from 'highcharts';
import { ThemeService } from '../../../services/theme.service';
import { GraficoMapaCalorComponent } from './grafico-mapa-calor.component';

describe('GraficoMapaCalorComponent', () => {
  beforeEach(() => {
    vi.spyOn(Highcharts, 'chart').mockReturnValue({
      destroy: vi.fn(),
    } as unknown as Highcharts.Chart);
    TestBed.configureTestingModule({
      imports: [GraficoMapaCalorComponent],
      providers: [{ provide: ThemeService, useValue: { oscuro: signal(false) } }],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('traduce la matriz a una serie heatmap de Highcharts', () => {
    const fixture = TestBed.createComponent(GraficoMapaCalorComponent);
    fixture.componentRef.setInput('datos', {
      titulo: 'Atraso',
      categoriasX: ['2025', '2026'],
      categoriasY: ['1-8 días'],
      valores: [[1.25, 2.5]],
      ejeYInvertido: true,
    });
    fixture.detectChanges();

    const opciones = fixture.componentInstance['opciones']();
    expect(opciones.chart?.type).toBe('heatmap');
    expect(opciones.series?.[0]).toMatchObject({
      type: 'heatmap',
      data: [
        [0, 0, 1.25],
        [1, 0, 2.5],
      ],
    });
  });
});
