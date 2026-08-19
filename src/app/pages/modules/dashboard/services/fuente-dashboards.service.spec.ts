import { signal, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { FuenteDashboardsService } from './fuente-dashboards.service';
import { DashboardService } from './dashboard.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { ReporteDashboard } from '../models/reporte.model';

@Component({ selector: 'app-blank', standalone: true, template: '' })
class BlankComponent {}

function reporte(overrides: Partial<ReporteDashboard> = {}): ReporteDashboard {
  return { id: 'r-1', name: 'Avance Comercial', reportType: 'PowerBI', ...overrides };
}

describe('FuenteDashboardsService', () => {
  let fuente: FuenteDashboardsService;
  let shell: ShellStateService;
  let router: Router;
  let dashboardFalso: {
    reportes: ReturnType<typeof signal<ReporteDashboard[]>>;
    seleccionarReporte: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dashboardFalso = { reportes: signal<ReporteDashboard[]>([]), seleccionarReporte: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: BlankComponent }]),
        { provide: DashboardService, useValue: dashboardFalso },
      ],
    });

    fuente = TestBed.inject(FuenteDashboardsService);
    shell = TestBed.inject(ShellStateService);
    router = TestBed.inject(Router);
  });

  it('mientras el módulo no cargó su lista, no aporta registros', () => {
    expect(fuente.registros()).toEqual([]);
  });

  it('indexa los reportes que el módulo tenga cargados', () => {
    dashboardFalso.reportes.set([reporte(), reporte({ id: 'r-2', name: 'Cartera' })]);

    expect(fuente.registros().map((r) => r.etiqueta)).toEqual(['Avance Comercial', 'Cartera']);
  });

  it('los marca como del módulo "Dashboards Integrados", que es la faceta con la que se refinan', () => {
    dashboardFalso.reportes.set([reporte()]);
    const registro = fuente.registros()[0];

    expect(registro.origen).toBe('Dashboards Integrados');
    expect(registro.tipo).toBe('Dashboard');
  });

  it('refleja lo que el módulo recargue, sin quedarse con una copia vieja', () => {
    dashboardFalso.reportes.set([reporte()]);
    expect(fuente.registros().length).toBe(1);

    dashboardFalso.reportes.set([reporte(), reporte({ id: 'r-2', name: 'Cartera' })]);

    expect(fuente.registros().length).toBe(2);
  });

  it('abrir un dashboard lo selecciona en el módulo y entra a la pantalla que lo dibuja', () => {
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    shell.setContenidoPendienteSeleccion(true);
    dashboardFalso.reportes.set([reporte()]);

    fuente.registros()[0].abrir();

    expect(dashboardFalso.seleccionarReporte).toHaveBeenCalledWith(reporte());
    expect(navegar).toHaveBeenCalledWith('/app/dashboards/power-bi');
    expect(shell.contenidoPendienteSeleccion()).toBe(false);
  });
});
