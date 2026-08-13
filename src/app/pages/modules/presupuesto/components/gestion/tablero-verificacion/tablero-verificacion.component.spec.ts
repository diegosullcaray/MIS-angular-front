import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TableroVerificacionComponent } from './tablero-verificacion.component';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import type { LogVerificacionFila } from '../../../models/tablero-verificacion.model';

function nodo(overrides: Partial<HierarquiaNodo> = {}): HierarquiaNodo {
  return { tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', ...overrides };
}

describe('TableroVerificacionComponent', () => {
  let presupuestoFalso: {
    obtenerLogVerificaciones: ReturnType<typeof vi.fn>;
    obtenerJerarquiaBase: ReturnType<typeof vi.fn>;
    obtenerJerarquiaNivel: ReturnType<typeof vi.fn>;
    fechaCorte: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    presupuestoFalso = {
      obtenerLogVerificaciones: vi.fn().mockReturnValue(of([])),
      obtenerJerarquiaBase: vi.fn().mockReturnValue(of([])),
      obtenerJerarquiaNivel: vi.fn().mockReturnValue(of([])),
      fechaCorte: vi.fn().mockReturnValue('2026-08-05'),
    };
    TestBed.configureTestingModule({
      imports: [TableroVerificacionComponent],
      providers: [{ provide: PresupuestoService, useValue: presupuestoFalso }, MessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(TableroVerificacionComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('no pide nada mientras falte elegir alguno de los 2 niveles', () => {
    const fixture = crear();

    fixture.componentInstance['onLineaSeleccionada'](nodo());

    expect(presupuestoFalso.obtenerLogVerificaciones).not.toHaveBeenCalled();
    expect(fixture.componentInstance['filas']()).toEqual([]);
  });

  it('con ambos niveles elegidos, pide el histórico con (tip_cod del segundo nivel, cod_rel de la línea)', () => {
    presupuestoFalso.obtenerLogVerificaciones.mockReturnValue(of([]));
    const fixture = crear();

    fixture.componentInstance['onLineaSeleccionada'](nodo({ tip_cod: 7, cod_rel: '231' }));
    fixture.componentInstance['onSegundoNivelSeleccionado'](nodo({ tip_cod: 99, cod_rel: '5' }));

    expect(presupuestoFalso.obtenerLogVerificaciones).toHaveBeenCalledWith(5, '231');
  });

  it('carga las filas del histórico cuando ambos niveles están listos', () => {
    const filas: LogVerificacionFila[] = [{ des_rel: 'Línea 1', cod_est: 1, usu_log: 'ana', tim_log: '09:00' }];
    presupuestoFalso.obtenerLogVerificaciones.mockReturnValue(of(filas));
    const fixture = crear();

    fixture.componentInstance['onLineaSeleccionada'](nodo());
    fixture.componentInstance['onSegundoNivelSeleccionado'](nodo({ tip_cod: 99, cod_rel: '5' }));

    expect(fixture.componentInstance['filas']()).toEqual(filas);
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('muestra un toast de error si falla la carga', () => {
    presupuestoFalso.obtenerLogVerificaciones.mockReturnValue(throwError(() => new Error('caído')));
    const fixture = crear();
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    fixture.componentInstance['onLineaSeleccionada'](nodo());
    fixture.componentInstance['onSegundoNivelSeleccionado'](nodo({ tip_cod: 99, cod_rel: '5' }));

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('al elegir un nuevo nivel, limpia el filtro de texto', () => {
    presupuestoFalso.obtenerLogVerificaciones.mockReturnValue(of([]));
    const fixture = crear();
    fixture.componentInstance['filtro'].set('algo escrito antes');

    fixture.componentInstance['onLineaSeleccionada'](nodo());

    expect(fixture.componentInstance['filtro']()).toBe('');
  });

  describe('filasFiltradas()', () => {
    const filas: LogVerificacionFila[] = [
      { des_rel: 'Agencia Norte', cod_est: 1, usu_log: 'ana', tim_log: '09:00' },
      { des_rel: 'Agencia Sur', cod_est: 0, usu_log: 'luis', tim_log: '10:00' },
    ];

    it('sin filtro, devuelve todas las filas', () => {
      presupuestoFalso.obtenerLogVerificaciones.mockReturnValue(of(filas));
      const fixture = crear();
      fixture.componentInstance['onLineaSeleccionada'](nodo());
      fixture.componentInstance['onSegundoNivelSeleccionado'](nodo({ tip_cod: 99, cod_rel: '5' }));

      expect(fixture.componentInstance['filasFiltradas']()).toEqual(filas);
    });

    it('filtra por des_rel, sin distinguir mayúsculas/minúsculas', () => {
      presupuestoFalso.obtenerLogVerificaciones.mockReturnValue(of(filas));
      const fixture = crear();
      fixture.componentInstance['onLineaSeleccionada'](nodo());
      fixture.componentInstance['onSegundoNivelSeleccionado'](nodo({ tip_cod: 99, cod_rel: '5' }));

      fixture.componentInstance['filtro'].set('norte');

      expect(fixture.componentInstance['filasFiltradas']()).toEqual([filas[0]]);
    });
  });

  describe('estadoIcono()', () => {
    it('cod_est === 1 se muestra en verde ("Verificado")', () => {
      const fixture = crear();
      expect(fixture.componentInstance['estadoIcono'](1)).toEqual({ icono: 'pi pi-circle-fill', color: '#39ff14', titulo: 'Verificado' });
    });

    it('cualquier otro valor se muestra en rojo ("Pendiente")', () => {
      const fixture = crear();
      expect(fixture.componentInstance['estadoIcono'](0)).toEqual({ icono: 'pi pi-circle-fill', color: '#fe2712', titulo: 'Pendiente' });
      expect(fixture.componentInstance['estadoIcono'](2)).toEqual({ icono: 'pi pi-circle-fill', color: '#fe2712', titulo: 'Pendiente' });
    });
  });
});
