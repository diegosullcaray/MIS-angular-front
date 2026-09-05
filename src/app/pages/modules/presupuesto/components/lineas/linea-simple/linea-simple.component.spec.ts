import { TestBed } from '@angular/core/testing';
import { of, throwError, type Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
import { LineaSimpleComponent } from './linea-simple.component';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import type { CeldaEditadaEvent } from '../../../../../../shared/ui/tablas/models/tabla-editable.model';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import type { FilaLineaSimple, LineaSimpleConfig, ResumenLineaSimple, ResumenMetadata } from '../../../models/linea-simple.model';

function metadata(overrides: Partial<ResumenMetadata> = {}): ResumenMetadata {
  return { tip_cod_edi: 4, ord_ini_edi: 3, act_res: true, cod_sec: 'SEC-1', ...overrides };
}

function nodo(overrides: Partial<HierarquiaNodo> = {}): HierarquiaNodo {
  return { tip_cod: 4, cod_rel: 'A1', desc_rel: 'Agencia 1', ...overrides };
}

describe('LineaSimpleComponent', () => {
  let presupuestoFalso: {
    esAdmin: ReturnType<typeof vi.fn>;
    verificar: ReturnType<typeof vi.fn>;
  };
  let obtenerResumen: ReturnType<typeof vi.fn<(tipCod: number, codRel: string) => Observable<ResumenLineaSimple>>>;
  let guardarResumen: ReturnType<typeof vi.fn<(tipCod: number, codRel: string, filas: FilaLineaSimple[]) => Observable<unknown>>>;
  let config: LineaSimpleConfig;

  beforeEach(() => {
    presupuestoFalso = {
      esAdmin: vi.fn().mockReturnValue(false),
      verificar: vi.fn().mockReturnValue(of({})),
    };
    obtenerResumen = vi.fn();
    guardarResumen = vi.fn().mockReturnValue(of({}));

    config = {
      mainTitle: 'Depósitos Banca Preferente',
      columnas: [{ label: 'Variación', key: 'a2' }],
      paramsHier: { code: 7, maxLvl: 2, dlgTitulo: 'JERARQUIA BANCA PREF.' },
      inputCols: ['a2', 'b2', 'c2'],
      obtenerResumen,
      guardarResumen,
    };

    TestBed.configureTestingModule({
      imports: [LineaSimpleComponent],
      providers: [{ provide: PresupuestoService, useValue: presupuestoFalso }, MessageService],
    });
  });

  function crear(cfg: LineaSimpleConfig = config) {
    const fixture = TestBed.createComponent(LineaSimpleComponent);
    fixture.componentRef.setInput('config', cfg);
    fixture.detectChanges();
    return fixture;
  }

  it('onNivelSeleccionado() carga el resumen del nodo elegido y separa filas/metadata', () => {
    const resumen: ResumenLineaSimple = { ws: [{ ord: 1, a2: 10 }], bp: metadata() };
    obtenerResumen.mockReturnValue(of(resumen));
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](nodo());

    expect(obtenerResumen).toHaveBeenCalledWith(4, 'A1');
    expect(fixture.componentInstance['filas']()).toEqual([{ ord: 1, a2: 10 }]);
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('onNivelSeleccionado() muestra un toast de error y apaga el loading si falla la carga', () => {
    obtenerResumen.mockReturnValue(throwError(() => new Error('caído')));
    const fixture = crear();
    const toast = TestBed.inject(ToastService);
    const errorSpy = vi.spyOn(toast, 'error');

    fixture.componentInstance['onNivelSeleccionado'](nodo());

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  // Las reglas exhaustivas de puedeGuardar/puedeVerificar/esEditable (customComponent del
  // legado) están cubiertas a fondo en utils/linea-simple-reglas.util.spec.ts — acá solo se
  // confirma que el componente efectivamente delega en esas funciones con el estado correcto.
  it('puedeGuardar()/puedeVerificar()/esEditable() delegan en las reglas compartidas con el estado cargado', () => {
    obtenerResumen.mockReturnValue(of({ ws: [], bp: metadata({ tip_cod_edi: 4, ord_ini_edi: 3, act_res: true }) }));
    presupuestoFalso.esAdmin.mockReturnValue(false);
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](nodo({ tip_cod: 4 }));

    expect(fixture.componentInstance['puedeGuardar']()).toBe(true);
    expect(fixture.componentInstance['puedeVerificar']()).toBe(false);
    expect(fixture.componentInstance['esEditable']({ ord: 5, a2: 1 }, 'a2')).toBe(true);
    expect(fixture.componentInstance['esEditable']({ ord: 5, a2: 1 }, 'otra-columna')).toBe(false);
  });

  it('onCeldaEditada() recalcula desde la fila editada hasta el final usando calcularFila()', () => {
    const calcularFila = vi.fn((filas: FilaLineaSimple[], idx: number) => {
      filas[idx]['tocada'] = true;
    });
    const cfg: LineaSimpleConfig = { ...config, calcularFila };
    obtenerResumen.mockReturnValue(of({ ws: [{ ord: 1 }, { ord: 2 }, { ord: 3 }], bp: metadata() }));
    const fixture = crear(cfg);
    fixture.componentInstance['onNivelSeleccionado'](nodo());

    const filas = fixture.componentInstance['filas']();
    const evento: CeldaEditadaEvent<FilaLineaSimple> = { fila: filas[1], key: 'a2', valor: 99 };
    fixture.componentInstance['onCeldaEditada'](evento);

    expect(calcularFila).toHaveBeenCalledTimes(2); // idx 1 y 2 (no la 0, ya pasada)
    expect(fixture.componentInstance['filas']()[0]['tocada']).toBeUndefined();
    expect(fixture.componentInstance['filas']()[1]['tocada']).toBe(true);
    expect(fixture.componentInstance['filas']()[2]['tocada']).toBe(true);
  });

  it('reiniciar() restaura las filas al snapshot original (descarta ediciones no guardadas)', () => {
    obtenerResumen.mockReturnValue(of({ ws: [{ ord: 1, a2: 10 }], bp: metadata() }));
    const fixture = crear();
    fixture.componentInstance['onNivelSeleccionado'](nodo());

    fixture.componentInstance['filas']()[0]['a2'] = 999;
    fixture.componentInstance['reiniciar']();

    expect(fixture.componentInstance['filas']()).toEqual([{ ord: 1, a2: 10 }]);
  });

  it('guardar() solo envía las filas con ord >= ord_ini_edi', () => {
    obtenerResumen.mockReturnValue(
      of({ ws: [{ ord: 1, a2: 1 }, { ord: 2, a2: 2 }, { ord: 3, a2: 3 }], bp: metadata({ ord_ini_edi: 2 }) })
    );
    const fixture = crear();
    fixture.componentInstance['onNivelSeleccionado'](nodo());

    fixture.componentInstance['guardar']();

    expect(guardarResumen).toHaveBeenCalledWith(4, 'A1', [{ ord: 2, a2: 2 }, { ord: 3, a2: 3 }]);
  });

  it('verificar() llama a PresupuestoService.verificar() con el nivel y cod_sec activos', () => {
    obtenerResumen.mockReturnValue(of({ ws: [], bp: metadata({ cod_sec: 'SEC-9' }) }));
    const fixture = crear();
    fixture.componentInstance['onNivelSeleccionado'](nodo({ tip_cod: 4, cod_rel: 'A1' }));

    fixture.componentInstance['verificar']();

    expect(presupuestoFalso.verificar).toHaveBeenCalledWith(4, 'A1', 'SEC-9');
  });
});
