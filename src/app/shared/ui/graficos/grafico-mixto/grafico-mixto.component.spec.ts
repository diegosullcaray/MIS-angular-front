import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import Highcharts from 'highcharts';
import { GraficoMixtoComponent } from './grafico-mixto.component';
import { ThemeService } from '../../../services/theme.service';
import type { BloqueGrafico } from '../models/grafico-comun.model';

describe('GraficoMixtoComponent', () => {
  let mockThemeService: { oscuro: ReturnType<typeof signal<boolean>> };
  const mockDatos: BloqueGrafico = {
    titulo: 'Evolución Cartera',
    categorias: ['Ene', 'Feb'],
    series: [
      { nombre: 'Colocaciones', datos: [100, 200] },
    ],
  };

  beforeEach(() => {
    vi.spyOn(Highcharts, 'chart').mockReturnValue({
      destroy: vi.fn(),
    } as unknown as Highcharts.Chart);

    mockThemeService = {
      oscuro: signal(false),
    };

    TestBed.configureTestingModule({
      imports: [GraficoMixtoComponent],
      providers: [{ provide: ThemeService, useValue: mockThemeService }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('se crea correctamente con los datos mínimos', () => {
    const fixture = TestBed.createComponent(GraficoMixtoComponent);
    fixture.componentRef.setInput('datos', mockDatos);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('computa las opciones del gráfico usando el tema actual', () => {
    const fixture = TestBed.createComponent(GraficoMixtoComponent);
    fixture.componentRef.setInput('datos', mockDatos);
    fixture.detectChanges();

    const opciones = fixture.componentInstance['opciones']();
    expect(opciones).toBeDefined();
    expect(opciones.series?.length).toBe(1);
  });
});
