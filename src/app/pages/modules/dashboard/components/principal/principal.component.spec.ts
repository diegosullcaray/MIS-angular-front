import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PrincipalComponent } from './principal.component';
import { DashboardService } from '../../services/dashboard.service';
import type { ReporteDashboard } from '../../models/reporte.model';

const POWER_BI: ReporteDashboard = { id: 'rep-1', name: 'Ventas', reportType: 'PowerBIReport' };
const ORACLE: ReporteDashboard = { id: 'rep-2', name: 'Cartera Oracle', reportType: 'OracleACReport' };

describe('PrincipalComponent', () => {
  let dashboardFalso: {
    reportes: ReturnType<typeof signal<ReporteDashboard[]>>;
    moduloAdmin: ReturnType<typeof signal<boolean>>;
    cargando: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    cargarReportes: ReturnType<typeof vi.fn>;
    recargarReportes: ReturnType<typeof vi.fn>;
    seleccionarReporte: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(() => {
    dashboardFalso = {
      reportes: signal<ReporteDashboard[]>([POWER_BI, ORACLE]),
      moduloAdmin: signal(false),
      cargando: signal(false),
      error: signal<string | null>(null),
      cargarReportes: vi.fn(),
      recargarReportes: vi.fn(),
      seleccionarReporte: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [PrincipalComponent],
      providers: [
        provideRouter([]),
        MessageService,
        { provide: DashboardService, useValue: dashboardFalso },
        { provide: ActivatedRoute, useValue: {} },
      ],
    });
    router = TestBed.inject(Router);
  });

  function crear() {
    const fixture = TestBed.createComponent(PrincipalComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al construirse, pide la lista de reportes', () => {
    crear();
    expect(dashboardFalso.cargarReportes).toHaveBeenCalled();
  });

  it('la tabla muestra dashboard.reportes() directo, sin filtros', () => {
    const fixture = crear();

    const filas = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(filas.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Ventas');
    expect(fixture.nativeElement.textContent).toContain('Cartera Oracle');
  });

  it('actualizar() delega en recargarReportes()', () => {
    const fixture = crear();
    fixture.componentInstance['actualizar']();
    expect(dashboardFalso.recargarReportes).toHaveBeenCalled();
  });

  it('abrirReporte() con un reporte Power BI selecciona el reporte y navega a power-bi', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = crear();

    fixture.componentInstance['abrirReporte'](POWER_BI);

    expect(dashboardFalso.seleccionarReporte).toHaveBeenCalledWith(POWER_BI);
    expect(navSpy).toHaveBeenCalledWith(['power-bi'], expect.anything());
  });

  it('abrirReporte() con un reporte que no es Power BI no hace nada', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = crear();

    fixture.componentInstance['abrirReporte'](ORACLE);

    expect(dashboardFalso.seleccionarReporte).not.toHaveBeenCalled();
    expect(navSpy).not.toHaveBeenCalled();
  });

  it('mostrarDialogoUsuarios() abre el diálogo de usuarios', () => {
    const fixture = crear();
    fixture.componentInstance['mostrarDialogoUsuarios']();
    expect(fixture.componentInstance['mostrarUsuarios']()).toBe(true);
  });

  it('iconoTipo() distingue Power BI de otros tipos', () => {
    const fixture = crear();
    expect(fixture.componentInstance['iconoTipo']('PowerBIReport')).toBe('pi pi-chart-line');
    expect(fixture.componentInstance['iconoTipo']('OracleACReport')).toBe('pi pi-database');
  });
});
