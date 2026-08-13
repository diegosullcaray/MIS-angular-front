import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PowerBiComponent } from './power-bi.component';
import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { ReporteDashboard } from '../../models/reporte.model';

const REPORTE: ReporteDashboard = { id: 'rep-1', name: 'Ventas', reportType: 'PowerBIReport', datasetId: 'ds-1' };

describe('PowerBiComponent', () => {
  let dashboardFalso: {
    reporteSeleccionado: ReturnType<typeof signal<ReporteDashboard | null>>;
    obtenerTokenReporte: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(() => {
    dashboardFalso = {
      reporteSeleccionado: signal<ReporteDashboard | null>(REPORTE),
      obtenerTokenReporte: vi.fn().mockReturnValue(of('tok-123')),
    };

    TestBed.configureTestingModule({
      imports: [PowerBiComponent],
      providers: [
        provideRouter([]),
        MessageService,
        { provide: DashboardService, useValue: dashboardFalso },
        { provide: ActivatedRoute, useValue: {} },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('con un reporte seleccionado, pide el token con su id/datasetId y arma el embedConfig', () => {
    const fixture = TestBed.createComponent(PowerBiComponent);
    fixture.detectChanges();

    expect(dashboardFalso.obtenerTokenReporte).toHaveBeenCalledWith('rep-1', 'ds-1');
    expect(fixture.componentInstance['cargando']()).toBe(false);
    expect(fixture.componentInstance['embedConfig']()).toMatchObject({
      id: 'rep-1',
      accessToken: 'tok-123',
      embedUrl: 'https://app.powerbi.com/reportEmbed',
    });
  });

  it('sin reporte seleccionado, vuelve a la lista sin pedir token', () => {
    dashboardFalso.reporteSeleccionado.set(null);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(PowerBiComponent);
    fixture.detectChanges();

    expect(dashboardFalso.obtenerTokenReporte).not.toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith(['../'], expect.anything());
  });

  it('si falla la carga del token, muestra un toast de error y apaga el loading', () => {
    dashboardFalso.obtenerTokenReporte.mockReturnValue(throwError(() => new Error('caído')));
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    const fixture = TestBed.createComponent(PowerBiComponent);
    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('volver() navega a la ruta padre', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(PowerBiComponent);
    fixture.detectChanges();

    fixture.componentInstance['volver']();

    expect(navSpy).toHaveBeenCalledWith(['../'], expect.anything());
  });
});
