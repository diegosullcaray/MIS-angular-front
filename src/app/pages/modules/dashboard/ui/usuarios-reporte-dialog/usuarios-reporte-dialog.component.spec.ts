import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { UsuariosReporteDialogComponent } from './usuarios-reporte-dialog.component';
import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { ReporteDashboard } from '../../models/reporte.model';

const REPORTES: ReporteDashboard[] = [{ id: 'rep-1', name: 'Ventas', reportType: 'PowerBIReport' }];

describe('UsuariosReporteDialogComponent', () => {
  let dashboardFalso: { obtenerUsuariosReporte: ReturnType<typeof vi.fn>; guardarUsuariosPorReporte: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    dashboardFalso = { obtenerUsuariosReporte: vi.fn(), guardarUsuariosPorReporte: vi.fn() };
    TestBed.configureTestingModule({
      imports: [UsuariosReporteDialogComponent],
      providers: [{ provide: DashboardService, useValue: dashboardFalso }, MessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(UsuariosReporteDialogComponent);
    fixture.componentRef.setInput('reportes', REPORTES);
    fixture.detectChanges();
    return fixture;
  }

  it('listaReportes() antepone la opción "Todos" a los reportes recibidos', () => {
    const fixture = crear();

    expect(fixture.componentInstance['listaReportes']()).toEqual([
      { id: '_ALL_', name: 'Todos' },
      { id: 'rep-1', name: 'Ventas' },
    ]);
  });

  it('seleccionarReporte() pide la lista de usuarios si no hay cambios en caché', () => {
    dashboardFalso.obtenerUsuariosReporte.mockReturnValue(of(['a@x.pe', 'b@x.pe']));
    const fixture = crear();

    fixture.componentInstance['seleccionarReporte']({ id: 'rep-1', name: 'Ventas' });

    expect(dashboardFalso.obtenerUsuariosReporte).toHaveBeenCalledWith('rep-1');
    expect(fixture.componentInstance['usuarios']()).toEqual(['a@x.pe', 'b@x.pe']);
  });

  it('agregarUsuario() agrega el código y marca el reporte como modificado', () => {
    dashboardFalso.obtenerUsuariosReporte.mockReturnValue(of([]));
    const fixture = crear();
    fixture.componentInstance['seleccionarReporte']({ id: 'rep-1', name: 'Ventas' });

    fixture.componentInstance['nuevoCodBt'].set('nuevo@x.pe');
    fixture.componentInstance['agregarUsuario']();

    expect(fixture.componentInstance['usuarios']()).toEqual(['nuevo@x.pe']);
    expect(fixture.componentInstance['huboCambios']()).toBe(true);
  });

  it('quitarUsuario() elimina el usuario seleccionado', () => {
    dashboardFalso.obtenerUsuariosReporte.mockReturnValue(of(['a@x.pe', 'b@x.pe']));
    const fixture = crear();
    fixture.componentInstance['seleccionarReporte']({ id: 'rep-1', name: 'Ventas' });
    fixture.componentInstance['seleccionarUsuario']('a@x.pe');

    fixture.componentInstance['quitarUsuario']();

    expect(fixture.componentInstance['usuarios']()).toEqual(['b@x.pe']);
  });

  it('refrescarUsuario() descarta los cambios y vuelve al snapshot del backend', () => {
    dashboardFalso.obtenerUsuariosReporte.mockReturnValue(of(['a@x.pe']));
    const fixture = crear();
    fixture.componentInstance['seleccionarReporte']({ id: 'rep-1', name: 'Ventas' });
    fixture.componentInstance['nuevoCodBt'].set('nuevo@x.pe');
    fixture.componentInstance['agregarUsuario']();

    fixture.componentInstance['refrescarUsuario']();

    expect(fixture.componentInstance['usuarios']()).toEqual(['a@x.pe']);
    expect(fixture.componentInstance['huboCambios']()).toBe(false);
  });

  it('guardarTodo() no llama al backend si no hay cambios', () => {
    const fixture = crear();
    fixture.componentInstance['guardarTodo']();
    expect(dashboardFalso.guardarUsuariosPorReporte).not.toHaveBeenCalled();
  });

  it('guardarTodo() envía los cambios acumulados y limpia el estado al terminar', () => {
    dashboardFalso.obtenerUsuariosReporte.mockReturnValue(of([]));
    dashboardFalso.guardarUsuariosPorReporte.mockReturnValue(of({}));
    const fixture = crear();
    fixture.componentInstance['seleccionarReporte']({ id: 'rep-1', name: 'Ventas' });
    fixture.componentInstance['nuevoCodBt'].set('nuevo@x.pe');
    fixture.componentInstance['agregarUsuario']();

    fixture.componentInstance['guardarTodo']();

    expect(dashboardFalso.guardarUsuariosPorReporte).toHaveBeenCalledWith([{ id: 'rep-1', val: 'nuevo@x.pe' }]);
    expect(fixture.componentInstance['huboCambios']()).toBe(false);
  });

  it('guardarTodo() ante un error del backend muestra un toast y mantiene los cambios', () => {
    dashboardFalso.obtenerUsuariosReporte.mockReturnValue(of([]));
    dashboardFalso.guardarUsuariosPorReporte.mockReturnValue(throwError(() => new Error('caído')));
    const fixture = crear();
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');
    fixture.componentInstance['seleccionarReporte']({ id: 'rep-1', name: 'Ventas' });
    fixture.componentInstance['nuevoCodBt'].set('nuevo@x.pe');
    fixture.componentInstance['agregarUsuario']();

    fixture.componentInstance['guardarTodo']();

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['huboCambios']()).toBe(true);
  });

  it('cerrar() emite visibleChange(false)', () => {
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.visibleChange.subscribe(emitido);

    fixture.componentInstance['cerrar']();

    expect(emitido).toHaveBeenCalledWith(false);
  });
});
