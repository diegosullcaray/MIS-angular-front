import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { UsuariosMetricaDialogComponent } from './usuarios-metrica-dialog.component';
import { FrameworkEsgService } from '../../services/framework-esg.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { EsgMetricaListItem } from '../../models/metrica.model';

describe('UsuariosMetricaDialogComponent', () => {
  let esgFalso: { obtenerUsuariosMetrica: ReturnType<typeof vi.fn>; guardarUsuariosPorMetrica: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    esgFalso = { obtenerUsuariosMetrica: vi.fn(), guardarUsuariosPorMetrica: vi.fn() };
    TestBed.configureTestingModule({
      imports: [UsuariosMetricaDialogComponent],
      providers: [{ provide: FrameworkEsgService, useValue: esgFalso }, MessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(UsuariosMetricaDialogComponent);
    fixture.componentRef.setInput('metricasPorCategoria', {
      1: [{ id: '15', nombre: 'Consumo de papel (Kg)' }] as EsgMetricaListItem[],
    });
    fixture.detectChanges();
    return fixture;
  }

  it('metricas() antepone la opción "Todos" a las métricas de la categoría elegida', () => {
    const fixture = crear();
    fixture.componentInstance['seleccionarCategoria'](1);

    expect(fixture.componentInstance['metricas']()).toEqual([
      { id: '-1', nombre: 'Todos' },
      { id: '15', nombre: 'Consumo de papel (Kg)' },
    ]);
  });

  it('seleccionarMetrica() pide la lista de usuarios si no hay cambios en caché', () => {
    esgFalso.obtenerUsuariosMetrica.mockReturnValue(of(['a@x.pe', 'b@x.pe']));
    const fixture = crear();

    fixture.componentInstance['seleccionarMetrica']({ id: '15', nombre: 'M' });

    expect(esgFalso.obtenerUsuariosMetrica).toHaveBeenCalledWith('15');
    expect(fixture.componentInstance['usuarios']()).toEqual(['a@x.pe', 'b@x.pe']);
  });

  it('seleccionarMetrica() usa la caché de cambios en vez de volver a pedir al backend', () => {
    esgFalso.obtenerUsuariosMetrica.mockReturnValue(of(['a@x.pe']));
    const fixture = crear();

    fixture.componentInstance['seleccionarMetrica']({ id: '15', nombre: 'M' });
    fixture.componentInstance['nuevoCodBt'].set('c@x.pe');
    fixture.componentInstance['agregarUsuario']();

    fixture.componentInstance['seleccionarMetrica']({ id: '99', nombre: 'Otra' });
    fixture.componentInstance['seleccionarMetrica']({ id: '15', nombre: 'M' });

    expect(esgFalso.obtenerUsuariosMetrica).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance['usuarios']()).toEqual(['a@x.pe', 'c@x.pe']);
  });

  it('agregarUsuario() agrega el código y marca la métrica como modificada', () => {
    esgFalso.obtenerUsuariosMetrica.mockReturnValue(of([]));
    const fixture = crear();
    fixture.componentInstance['seleccionarMetrica']({ id: '15', nombre: 'M' });

    fixture.componentInstance['nuevoCodBt'].set('nuevo@x.pe');
    fixture.componentInstance['agregarUsuario']();

    expect(fixture.componentInstance['usuarios']()).toEqual(['nuevo@x.pe']);
    expect(fixture.componentInstance['huboCambios']()).toBe(true);
    expect(fixture.componentInstance['nuevoCodBt']()).toBe('');
  });

  it('quitarUsuario() elimina el usuario seleccionado', () => {
    esgFalso.obtenerUsuariosMetrica.mockReturnValue(of(['a@x.pe', 'b@x.pe']));
    const fixture = crear();
    fixture.componentInstance['seleccionarMetrica']({ id: '15', nombre: 'M' });
    fixture.componentInstance['seleccionarUsuario']('a@x.pe');

    fixture.componentInstance['quitarUsuario']();

    expect(fixture.componentInstance['usuarios']()).toEqual(['b@x.pe']);
  });

  it('refrescarUsuario() descarta los cambios y vuelve al snapshot del backend', () => {
    esgFalso.obtenerUsuariosMetrica.mockReturnValue(of(['a@x.pe']));
    const fixture = crear();
    fixture.componentInstance['seleccionarMetrica']({ id: '15', nombre: 'M' });
    fixture.componentInstance['nuevoCodBt'].set('nuevo@x.pe');
    fixture.componentInstance['agregarUsuario']();
    expect(fixture.componentInstance['huboCambios']()).toBe(true);

    fixture.componentInstance['refrescarUsuario']();

    expect(fixture.componentInstance['usuarios']()).toEqual(['a@x.pe']);
    expect(fixture.componentInstance['huboCambios']()).toBe(false);
  });

  it('guardarTodo() no llama al backend si no hay cambios', () => {
    const fixture = crear();
    fixture.componentInstance['guardarTodo']();
    expect(esgFalso.guardarUsuariosPorMetrica).not.toHaveBeenCalled();
  });

  it('guardarTodo() envía todos los cambios acumulados y limpia el estado al terminar', () => {
    esgFalso.obtenerUsuariosMetrica.mockReturnValue(of([]));
    esgFalso.guardarUsuariosPorMetrica.mockReturnValue(of({}));
    const fixture = crear();
    fixture.componentInstance['seleccionarMetrica']({ id: '15', nombre: 'M' });
    fixture.componentInstance['nuevoCodBt'].set('nuevo@x.pe');
    fixture.componentInstance['agregarUsuario']();

    fixture.componentInstance['guardarTodo']();

    expect(esgFalso.guardarUsuariosPorMetrica).toHaveBeenCalledWith([{ id: '15', val: 'nuevo@x.pe' }]);
    expect(fixture.componentInstance['huboCambios']()).toBe(false);
  });

  it('guardarTodo() ante un error del backend muestra un toast y mantiene los cambios', () => {
    esgFalso.obtenerUsuariosMetrica.mockReturnValue(of([]));
    esgFalso.guardarUsuariosPorMetrica.mockReturnValue(throwError(() => new Error('caído')));
    const fixture = crear();
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');
    fixture.componentInstance['seleccionarMetrica']({ id: '15', nombre: 'M' });
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
