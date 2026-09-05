import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import Highcharts from 'highcharts';
import { GraficoPieComponent } from './grafico-pie.component';
import { ThemeService } from '../../../services/theme.service';
import type { PorcionGrafico } from '../models/grafico-comun.model';

describe('GraficoPieComponent', () => {
  let mockThemeService: { oscuro: ReturnType<typeof signal<boolean>> };
  const mockPorciones: PorcionGrafico[] = [
    { nombre: 'Normal', valor: 85 },
    { nombre: 'Mora', valor: 15 },
  ];

  beforeEach(() => {
    vi.spyOn(Highcharts, 'chart').mockReturnValue({
      destroy: vi.fn(),
    } as unknown as Highcharts.Chart);

    mockThemeService = {
      oscuro: signal(false),
    };

    TestBed.configureTestingModule({
      imports: [GraficoPieComponent],
      providers: [{ provide: ThemeService, useValue: mockThemeService }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('se crea correctamente con las porciones requeridas', () => {
    const fixture = TestBed.createComponent(GraficoPieComponent);
    fixture.componentRef.setInput('porciones', mockPorciones);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('computa las opciones de tipo pie o dona', () => {
    const fixture = TestBed.createComponent(GraficoPieComponent);
    fixture.componentRef.setInput('porciones', mockPorciones);
    fixture.componentRef.setInput('dona', true);
    fixture.detectChanges();

    const opciones = fixture.componentInstance['opciones']();
    expect(opciones).toBeDefined();
    expect(opciones.chart?.type).toBe('pie');
  });
});
