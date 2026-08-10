import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { PrincipalComponent } from './principal.component';
import { FrameworkEsgService } from '../../services/framework-esg.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { EsgConfiguracionModulo, EsgMetricaFila, EsgResumenCategoria } from '../../models';

// jsdom no implementa ResizeObserver — lo usa internamente `p-tabs` (PrimeNG) al
// inicializar (`TabList.bindResizeObserver`). Mismo gap que sufren los specs de
// `CarteraCreditosComponent` (también `p-tabs`), sin stub — se acota acá para no
// tocar la config de test compartida.
class ResizeObserverFalso {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

function configuracion(overrides: Partial<EsgConfiguracionModulo> = {}): EsgConfiguracionModulo {
  return {
    situaciones: [{ cod: 1, des: 'Activo' }],
    atributos: [{ key: 'meta', label: 'Meta' }],
    categorias: [{ cod: 1, des: 'Medioambiente' }],
    moduloAdmin: false,
    puedeEditar: true,
    ...overrides,
  };
}

function metrica(overrides: Partial<EsgMetricaFila> = {}): EsgMetricaFila {
  return {
    cod_met: 15,
    cod_cat: 1,
    des_met: 'Consumo de papel',
    des_med: 'Kg',
    des_dis: 'Sí',
    sit_met: 1,
    cfg_met: '{}',
    ...overrides,
  };
}

describe('PrincipalComponent', () => {
  let esgFalso: {
    cargarConfiguracion: ReturnType<typeof vi.fn>;
    cargarResumenPortada: ReturnType<typeof vi.fn>;
    cargarResumenCategoria: ReturnType<typeof vi.fn>;
    esAdmin: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    (globalThis as unknown as { ResizeObserver: typeof ResizeObserverFalso }).ResizeObserver = ResizeObserverFalso;

    esgFalso = {
      cargarConfiguracion: vi.fn().mockReturnValue(of(configuracion())),
      cargarResumenPortada: vi.fn().mockReturnValue(of([])),
      cargarResumenCategoria: vi.fn().mockReturnValue(of({ columnasHistoricas: [], filas: [] } as EsgResumenCategoria)),
      esAdmin: vi.fn((cfg: EsgConfiguracionModulo | null) => cfg?.moduloAdmin ?? false),
    };

    TestBed.configureTestingModule({
      imports: [PrincipalComponent],
      providers: [{ provide: FrameworkEsgService, useValue: esgFalso }, MessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(PrincipalComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al construirse, pide configuración, portada y las 4 categorías', () => {
    crear();

    expect(esgFalso.cargarConfiguracion).toHaveBeenCalled();
    expect(esgFalso.cargarResumenPortada).toHaveBeenCalled();
    expect(esgFalso.cargarResumenCategoria).toHaveBeenCalledTimes(4);
    expect(esgFalso.cargarResumenCategoria.mock.calls.map((c) => c[0]).sort()).toEqual([1, 2, 3, 4]);
  });

  it('pasa el admin del Host (no el del módulo) como is_admin a cargarResumenCategoria', () => {
    const shell = TestBed.inject(ShellStateService);
    vi.spyOn(shell, 'esAdmin').mockReturnValue(true as any);

    crear();

    esgFalso.cargarResumenCategoria.mock.calls.forEach((llamada) => {
      expect(llamada[1]).toBe(true);
    });
  });

  it('disableEditar()/disableDetalle() empiezan deshabilitados sin selección', () => {
    const fixture = crear();
    expect(fixture.componentInstance['disableEditar']()).toBe(true);
    expect(fixture.componentInstance['disableDetalle']()).toBe(true);
  });

  it('disableEditar() se habilita solo si is_edit===1', () => {
    const fixture = crear();
    fixture.componentInstance['onFilaSeleccionada'](metrica({ is_edit: 1 }));
    expect(fixture.componentInstance['disableEditar']()).toBe(false);

    fixture.componentInstance['onFilaSeleccionada'](metrica({ is_edit: 0 }));
    expect(fixture.componentInstance['disableEditar']()).toBe(true);
  });

  it('disableDetalle() se deshabilita solo si is_nod===1', () => {
    const fixture = crear();
    fixture.componentInstance['onFilaSeleccionada'](metrica({ is_nod: 1 }));
    expect(fixture.componentInstance['disableDetalle']()).toBe(true);

    fixture.componentInstance['onFilaSeleccionada'](metrica({ is_nod: 0 }));
    expect(fixture.componentInstance['disableDetalle']()).toBe(false);
  });

  it('mostrarDialogoEditar()/mostrarDialogoDetalle() fijan modoEdicion y abren el diálogo', () => {
    const fixture = crear();

    fixture.componentInstance['mostrarDialogoEditar']();
    expect(fixture.componentInstance['modoEdicion']()).toBe(true);
    expect(fixture.componentInstance['mostrarEditar']()).toBe(true);

    fixture.componentInstance['mostrarEditar'].set(false);
    fixture.componentInstance['mostrarDialogoDetalle']();
    expect(fixture.componentInstance['modoEdicion']()).toBe(false);
    expect(fixture.componentInstance['mostrarEditar']()).toBe(true);
  });

  it('mostrarDialogoUsuarios() abre el diálogo de usuarios', () => {
    const fixture = crear();
    fixture.componentInstance['mostrarDialogoUsuarios']();
    expect(fixture.componentInstance['mostrarUsuarios']()).toBe(true);
  });

  it('onMetricaGuardada() recarga la categoría de la fila seleccionada', () => {
    const fixture = crear();
    esgFalso.cargarResumenCategoria.mockClear();
    fixture.componentInstance['onFilaSeleccionada'](metrica({ cod_cat: 3 }));

    fixture.componentInstance['onMetricaGuardada']();

    expect(esgFalso.cargarResumenCategoria).toHaveBeenCalledWith(3, expect.any(Boolean));
  });

  it('metricasPorCategoria() excluye filas is_nod===1 y arma "des_met (des_med)"', () => {
    esgFalso.cargarResumenCategoria.mockImplementation((codCat: number) =>
      of({
        columnasHistoricas: [],
        filas:
          codCat === 1
            ? [metrica({ cod_met: 1, is_nod: 0 }), metrica({ cod_met: 2, is_nod: 1, des_met: 'Nodo' })]
            : [],
      } as EsgResumenCategoria)
    );
    const fixture = crear();

    expect(fixture.componentInstance['metricasPorCategoria']()[1]).toEqual([
      { id: '1', nombre: 'Consumo de papel (Kg)' },
    ]);
  });

  it('si falla la carga de portada, muestra un toast de error', () => {
    esgFalso.cargarResumenPortada.mockReturnValue(throwError(() => new Error('caído')));
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    crear();

    expect(errorSpy).toHaveBeenCalled();
  });

  it('si falla la carga de una categoría, muestra un toast de error y apaga su loading', () => {
    esgFalso.cargarResumenCategoria.mockReturnValue(throwError(() => new Error('caído')));
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    const fixture = crear();

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargandoCategorias']()[1]).toBe(false);
  });
});
