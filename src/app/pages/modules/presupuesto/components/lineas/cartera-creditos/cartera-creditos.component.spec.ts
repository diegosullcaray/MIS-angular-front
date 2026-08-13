import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CarteraCreditosComponent } from './cartera-creditos.component';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import type { CeldaEditadaEvent } from '../../../models/tabla.model';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import type { ResumenMetadata } from '../../../models/linea-simple.model';
import type { FilaCarteraCreditosVariables, ResumenCarteraCreditos } from '../../../models/cartera-creditos.model';

function metadata(overrides: Partial<ResumenMetadata> = {}): ResumenMetadata {
  return { tip_cod_edi: 4, ord_ini_edi: 1, act_res: true, cod_sec: 'SEC-1', ...overrides };
}

function nodo(overrides: Partial<HierarquiaNodo> = {}): HierarquiaNodo {
  return { tip_cod: 4, cod_rel: 'A1', desc_rel: 'Admin Comercial 1', ...overrides };
}

function filaVariables(overrides: Partial<FilaCarteraCreditosVariables> = {}): FilaCarteraCreditosVariables {
  return { ord: 1, a1: 0, a2: 0, a3: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0, c1: 0, c2: 0, ...overrides };
}

// jsdom no implementa ResizeObserver — lo usa internamente `p-tabs` (PrimeNG) al
// inicializar (`TabList.bindResizeObserver`), y este componente tiene tabs de
// composición (Monto/Ratio).
class ResizeObserverFalso {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('CarteraCreditosComponent', () => {
  let presupuestoFalso: {
    esAdmin: ReturnType<typeof vi.fn>;
    verificar: ReturnType<typeof vi.fn>;
    obtenerResumenCarteraCreditos: ReturnType<typeof vi.fn>;
    guardarResumenCarteraCreditos: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    (globalThis as unknown as { ResizeObserver: typeof ResizeObserverFalso }).ResizeObserver = ResizeObserverFalso;

    presupuestoFalso = {
      esAdmin: vi.fn().mockReturnValue(false),
      verificar: vi.fn().mockReturnValue(of({})),
      obtenerResumenCarteraCreditos: vi.fn(),
      guardarResumenCarteraCreditos: vi.fn().mockReturnValue(of({})),
    };
    TestBed.configureTestingModule({
      imports: [CarteraCreditosComponent],
      providers: [{ provide: PresupuestoService, useValue: presupuestoFalso }, MessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(CarteraCreditosComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('onNivelSeleccionado() carga variables (ws) y composición (cs) por separado, con sus propios snapshots', () => {
    const resumen: ResumenCarteraCreditos = {
      ws: [filaVariables({ a1: 100 })],
      cs: [{ ord: 1, g_1: 0.1 }],
      bp: metadata(),
    };
    presupuestoFalso.obtenerResumenCarteraCreditos.mockReturnValue(of(resumen));
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](nodo());

    expect(presupuestoFalso.obtenerResumenCarteraCreditos).toHaveBeenCalledWith(4, 'A1');
    expect(fixture.componentInstance['filas']()).toEqual([filaVariables({ a1: 100 })]);
    expect(fixture.componentInstance['filasComposicion']()).toEqual([{ ord: 1, g_1: 0.1 }]);
  });

  it('onNivelSeleccionado() muestra un toast de error si falla la carga', () => {
    presupuestoFalso.obtenerResumenCarteraCreditos.mockReturnValue(throwError(() => new Error('caído')));
    const fixture = crear();
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    fixture.componentInstance['onNivelSeleccionado'](nodo());

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('onCeldaEditada() aplica primero la cascada de asesores y luego recalcula desde el índice que ésta indique', () => {
    const resumen: ResumenCarteraCreditos = {
      ws: [
        filaVariables({ ord: 1, b1: 10, b2: 0, b3: 1 }),
        filaVariables({ ord: 2, b1: 0, b2: 5, b3: 1 }),
        filaVariables({ ord: 3, b3: 1 }),
      ],
      cs: [{ ord: 1 }, { ord: 2 }, { ord: 3 }],
      bp: metadata(),
    };
    presupuestoFalso.obtenerResumenCarteraCreditos.mockReturnValue(of(resumen));
    const fixture = crear();
    fixture.componentInstance['onNivelSeleccionado'](nodo());

    const filas = fixture.componentInstance['filas']();
    const evento: CeldaEditadaEvent<FilaCarteraCreditosVariables> = { fila: filas[0], key: 'b1', valor: 10 };
    fixture.componentInstance['onCeldaEditada'](evento);

    // b1 editado en idx 0 → cascada de asesores actualiza b2 desde idx 2 (b2[2] = b1[0] + b2[1] = 10 + 5 = 15)
    expect(fixture.componentInstance['filas']()[2]['b2']).toBe(15);
    // y la cascada principal (Operaciones Desembolsadas, etc.) corrió desde idx 2 en adelante
    expect(fixture.componentInstance['filas']()[2]['b4']).toBe(15); // floor(b2=15 * b3=1)
  });

  it('reiniciar() restaura tanto las filas de variables como las de composición', () => {
    const resumen: ResumenCarteraCreditos = {
      ws: [filaVariables({ a1: 100 })],
      cs: [{ ord: 1, g_1: 0.5 }],
      bp: metadata(),
    };
    presupuestoFalso.obtenerResumenCarteraCreditos.mockReturnValue(of(resumen));
    const fixture = crear();
    fixture.componentInstance['onNivelSeleccionado'](nodo());

    fixture.componentInstance['filas']()[0].a1 = 999;
    fixture.componentInstance['filasComposicion']()[0]['g_1'] = 999;
    fixture.componentInstance['reiniciar']();

    expect(fixture.componentInstance['filas']()).toEqual([filaVariables({ a1: 100 })]);
    expect(fixture.componentInstance['filasComposicion']()).toEqual([{ ord: 1, g_1: 0.5 }]);
  });

  it('guardar() solo envía las filas de variables con ord >= ord_ini_edi (no reenvía la composición)', () => {
    const resumen: ResumenCarteraCreditos = {
      ws: [filaVariables({ ord: 1, a1: 1 }), filaVariables({ ord: 2, a1: 2 })],
      cs: [{ ord: 1 }, { ord: 2 }],
      bp: metadata({ ord_ini_edi: 2 }),
    };
    presupuestoFalso.obtenerResumenCarteraCreditos.mockReturnValue(of(resumen));
    const fixture = crear();
    fixture.componentInstance['onNivelSeleccionado'](nodo());

    fixture.componentInstance['guardar']();

    expect(presupuestoFalso.guardarResumenCarteraCreditos).toHaveBeenCalledWith(4, 'A1', [filaVariables({ ord: 2, a1: 2 })]);
  });

  it('verificar() llama a PresupuestoService.verificar() con el nivel y cod_sec activos', () => {
    presupuestoFalso.obtenerResumenCarteraCreditos.mockReturnValue(of({ ws: [], cs: [], bp: metadata({ cod_sec: 'SEC-9' }) }));
    const fixture = crear();
    fixture.componentInstance['onNivelSeleccionado'](nodo({ tip_cod: 4, cod_rel: 'A1' }));

    fixture.componentInstance['verificar']();

    expect(presupuestoFalso.verificar).toHaveBeenCalledWith(4, 'A1', 'SEC-9');
  });

  it('soloLectura() siempre es false (los tabs de composición son de solo lectura)', () => {
    const fixture = crear();
    expect(fixture.componentInstance['soloLectura']()).toBe(false);
  });
});
