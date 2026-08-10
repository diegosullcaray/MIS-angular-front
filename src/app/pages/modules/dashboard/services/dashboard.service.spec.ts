import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { ModDashboardService } from '../../../../core/winder/instances/mod-dashboard.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';
import type { UsuarioActivo } from '../../../../core/interfaces/shell-state.model';
import type { ReporteDashboard } from '../models';

function usuario(overrides: Partial<UsuarioActivo> = {}): UsuarioActivo {
  return {
    id: 'u-1',
    nombre: 'Ana Torres',
    email: 'ana.torres@confianza.pe',
    rol: 'supervisor-area',
    subsistemas: [],
    codBt: 'BT-001',
    ...overrides,
  };
}

function respuesta(body: unknown): IWinderResponse {
  return { code: '0', headers: {}, body };
}

const REPORTE: ReporteDashboard = { id: 'rep-1', name: 'Ventas', reportType: 'PowerBIReport', typ_rep: 1, datasetId: 'ds-1' };

interface AntFalso {
  getObjectList: ReturnType<typeof vi.fn>;
  getPowerBIReportToken: ReturnType<typeof vi.fn>;
  getObjectUsers: ReturnType<typeof vi.fn>;
  postObjectUsers: ReturnType<typeof vi.fn>;
}

describe('DashboardService', () => {
  let service: DashboardService;
  let shell: ShellStateService;
  let ant: AntFalso;

  beforeEach(() => {
    ant = {
      getObjectList: vi.fn(),
      getPowerBIReportToken: vi.fn(),
      getObjectUsers: vi.fn(),
      postObjectUsers: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ModDashboardService, useValue: ant }],
    });
    service = TestBed.inject(DashboardService);
    shell = TestBed.inject(ShellStateService);
    shell.setUsuarioActivo(usuario());
  });

  it('cargarReportes() pide la lista con el cod_bt del usuario activo y el admin del Host como is_admin', () => {
    vi.spyOn(shell, 'esAdmin').mockReturnValue(true as any);
    ant.getObjectList.mockReturnValue(of(respuesta({ resultado: { list: [REPORTE], mod_admin: 1 } })));

    service.cargarReportes();

    expect(ant.getObjectList).toHaveBeenCalledWith('BT-001', 1);
    expect(service.reportes()).toEqual([REPORTE]);
    expect(service.moduloAdmin()).toBe(true);
    expect(service.cargando()).toBe(false);
  });

  it('cargarReportes() pasa is_admin=0 cuando el usuario no es admin del Host', () => {
    vi.spyOn(shell, 'esAdmin').mockReturnValue(false as any);
    ant.getObjectList.mockReturnValue(of(respuesta({ resultado: { list: [], mod_admin: 0 } })));

    service.cargarReportes();

    expect(ant.getObjectList).toHaveBeenCalledWith('BT-001', 0);
    expect(service.moduloAdmin()).toBe(false);
  });

  it('cargarReportes() no vuelve a pedir la lista en una segunda llamada', () => {
    ant.getObjectList.mockReturnValue(of(respuesta({ resultado: { list: [], mod_admin: 0 } })));

    service.cargarReportes();
    service.cargarReportes();

    expect(ant.getObjectList).toHaveBeenCalledTimes(1);
  });

  it('recargarReportes() fuerza una nueva petición aunque ya se hubiera cargado', () => {
    ant.getObjectList.mockReturnValue(of(respuesta({ resultado: { list: [], mod_admin: 0 } })));

    service.cargarReportes();
    service.recargarReportes();

    expect(ant.getObjectList).toHaveBeenCalledTimes(2);
  });

  it('cargarReportes() ante un error, deja el estado listo para reintentar', () => {
    ant.getObjectList.mockReturnValue(throwError(() => new Error('caído')));

    service.cargarReportes();

    expect(service.error()).toBeTruthy();
    expect(service.cargando()).toBe(false);

    ant.getObjectList.mockReturnValue(of(respuesta({ resultado: { list: [REPORTE], mod_admin: 0 } })));
    service.cargarReportes();

    expect(ant.getObjectList).toHaveBeenCalledTimes(2);
    expect(service.reportes()).toEqual([REPORTE]);
  });

  it('seleccionarReporte() actualiza reporteSeleccionado', () => {
    service.seleccionarReporte(REPORTE);
    expect(service.reporteSeleccionado()).toEqual(REPORTE);
  });

  it('obtenerTokenReporte() devuelve el token del backend', async () => {
    ant.getPowerBIReportToken.mockReturnValue(of(respuesta({ resultado: { token: 'tok-123' } })));

    const token = await new Promise((resolve) => service.obtenerTokenReporte('rep-1', 'ds-1').subscribe(resolve));

    expect(ant.getPowerBIReportToken).toHaveBeenCalledWith('rep-1', 'ds-1');
    expect(token).toBe('tok-123');
  });

  it('obtenerTokenReporte() devuelve cadena vacía si el backend no trae token', async () => {
    ant.getPowerBIReportToken.mockReturnValue(of(respuesta({})));
    const token = await new Promise((resolve) => service.obtenerTokenReporte('rep-1', 'ds-1').subscribe(resolve));
    expect(token).toBe('');
  });

  it('obtenerUsuariosReporte() separa use_lis por coma', async () => {
    ant.getObjectUsers.mockReturnValue(of(respuesta({ resultado: { code: 'ok', row: { use_lis: 'a@x.pe,b@x.pe' } } })));

    const resultado = await new Promise((resolve) => service.obtenerUsuariosReporte('rep-1').subscribe(resolve));

    expect(ant.getObjectUsers).toHaveBeenCalledWith('rep-1');
    expect(resultado).toEqual(['a@x.pe', 'b@x.pe']);
  });

  it('obtenerUsuariosReporte() devuelve un arreglo vacío si code es "void"', async () => {
    ant.getObjectUsers.mockReturnValue(of(respuesta({ resultado: { code: 'void' } })));
    const resultado = await new Promise((resolve) => service.obtenerUsuariosReporte('rep-1').subscribe(resolve));
    expect(resultado).toEqual([]);
  });

  it('guardarUsuariosPorReporte() delega en postObjectUsers() con el arreglo de cambios', () => {
    ant.postObjectUsers.mockReturnValue(of({}));
    const cambios = [{ id: 'rep-1', val: 'a@x.pe' }];

    service.guardarUsuariosPorReporte(cambios).subscribe();

    expect(ant.postObjectUsers).toHaveBeenCalledWith(cambios);
  });
});
