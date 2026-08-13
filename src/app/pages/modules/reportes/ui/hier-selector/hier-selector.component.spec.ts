import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HierSelectorComponent } from './hier-selector.component';
import { ReportesService } from '../../services/reportes.service';
import type { HierarquiaNodo, ParamsJerarquia } from '../../models';

const PARAMS: ParamsJerarquia = { code: 9, maxLvl: 2, dlgTitulo: 'JERARQUIA UNIDAD' };

describe('HierSelectorComponent', () => {
  let reportesFalso: {
    obtenerJerarquiaBase: ReturnType<typeof vi.fn>;
    obtenerJerarquiaNivel: ReturnType<typeof vi.fn>;
    fechaCorte: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    reportesFalso = {
      obtenerJerarquiaBase: vi.fn().mockReturnValue(of([] as HierarquiaNodo[])),
      obtenerJerarquiaNivel: vi.fn().mockReturnValue(of([] as HierarquiaNodo[])),
      fechaCorte: vi.fn().mockReturnValue('2026-08-05'),
    };

    TestBed.configureTestingModule({
      imports: [HierSelectorComponent],
      providers: [{ provide: ReportesService, useValue: reportesFalso }],
    });
  });

  function crear(params: ParamsJerarquia = PARAMS) {
    const fixture = TestBed.createComponent(HierSelectorComponent);
    fixture.componentRef.setInput('paramsHier', params);
    fixture.detectChanges();
    return fixture;
  }

  /** Sin `detectChanges()` — para poder suscribirse a `error`/`nodoSeleccionado` antes de que `ngOnInit()` dispare la carga (los observables mockeados emiten sincrónicamente). */
  function crearSinInit(params: ParamsJerarquia = PARAMS) {
    const fixture = TestBed.createComponent(HierSelectorComponent);
    fixture.componentRef.setInput('paramsHier', params);
    return fixture;
  }

  it('cargarRaiz() pide la jerarquía base al inicializarse', () => {
    reportesFalso.obtenerJerarquiaBase.mockReturnValue(
      of([{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza' }] as HierarquiaNodo[])
    );
    crear();

    expect(reportesFalso.obtenerJerarquiaBase).toHaveBeenCalledWith(9);
  });

  it('cargarRaiz() pide level_hier del propio nivel de la raíz (root.lvl), no el nivel hijo', () => {
    reportesFalso.obtenerJerarquiaBase.mockReturnValue(
      of([{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', lvl: 1 } as HierarquiaNodo])
    );
    crear();

    // Confirmado contra el legado (log real de `hier-rem-selector.component.ts` en producción):
    // la primera llamada pide `lvl = root.lvl` (1) — devuelve la raíz "hidratada" con
    // des_rel/lbl_hier, no sus hijos.
    expect(reportesFalso.obtenerJerarquiaNivel).toHaveBeenCalledWith(9, 1, 7, ['231'], expect.objectContaining({ key: 'fec' }));
  });

  it('onSeleccionarNivel() actualiza el nivel y pide el siguiente nivel si no supera maxLvl', () => {
    reportesFalso.obtenerJerarquiaBase.mockReturnValue(
      of([{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza' }] as HierarquiaNodo[])
    );
    reportesFalso.obtenerJerarquiaNivel.mockReturnValue(
      of([{ tip_cod: 4, cod_rel: 'A1', des_rel: 'Agencia 1', lbl_hier: 'AGENCIA' }] as HierarquiaNodo[])
    );
    const fixture = crear({ code: 9, maxLvl: 2, dlgTitulo: 'x' });
    const instancia = fixture.componentInstance;
    const emitSpy = vi.fn();
    instancia.nodoSeleccionado.subscribe(emitSpy);

    const nodoElegido = { tip_cod: 4, cod_rel: 'A1', des_rel: 'Agencia 1', lvl: 2 };
    instancia['onSeleccionarNivel'](0, nodoElegido);

    expect(emitSpy).toHaveBeenCalledWith(nodoElegido);
  });

  it('emite error si la jerarquía base viene vacía — nunca llegaría a emitir nodoSeleccionado', () => {
    reportesFalso.obtenerJerarquiaBase.mockReturnValue(of([] as HierarquiaNodo[]));
    const fixture = crearSinInit();
    const errorSpy = vi.fn();
    fixture.componentInstance.error.subscribe(errorSpy);

    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('emite error si falla la petición de jerarquía base', () => {
    reportesFalso.obtenerJerarquiaBase.mockReturnValue(throwError(() => new Error('caído')));
    const fixture = crearSinInit();
    const errorSpy = vi.fn();
    fixture.componentInstance.error.subscribe(errorSpy);

    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('emite error si la carga inicial del primer nivel falla, aunque la raíz sí se haya resuelto', () => {
    reportesFalso.obtenerJerarquiaBase.mockReturnValue(
      of([{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza' }] as HierarquiaNodo[])
    );
    reportesFalso.obtenerJerarquiaNivel.mockReturnValue(throwError(() => new Error('caído')));
    const fixture = crearSinInit();
    const errorSpy = vi.fn();
    const nodoSpy = vi.fn();
    fixture.componentInstance.error.subscribe(errorSpy);
    fixture.componentInstance.nodoSeleccionado.subscribe(nodoSpy);

    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalled();
    expect(nodoSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('`error` es solo para la carga inicial: si falla un nivel más profundo, no se emite', () => {
    reportesFalso.obtenerJerarquiaBase.mockReturnValue(
      of([{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza' }] as HierarquiaNodo[])
    );
    reportesFalso.obtenerJerarquiaNivel
      .mockReturnValueOnce(of([{ tip_cod: 4, cod_rel: 'A1', des_rel: 'Agencia 1', lbl_hier: 'AGENCIA', lvl: 2 }] as HierarquiaNodo[]))
      .mockReturnValueOnce(throwError(() => new Error('caído')));
    const fixture = crearSinInit({ code: 9, maxLvl: 3, dlgTitulo: 'x' });
    const errorSpy = vi.fn();
    fixture.componentInstance.error.subscribe(errorSpy);

    fixture.detectChanges();

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('al cargar NO emite nodoSeleccionado: entrar a la pantalla no debe pedir ningún reporte', () => {
    reportesFalso.obtenerJerarquiaBase.mockReturnValue(
      of([{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', lvl: 1 }] as HierarquiaNodo[])
    );
    reportesFalso.obtenerJerarquiaNivel
      .mockReturnValueOnce(of([{ tip_cod: 7, cod_rel: '231', des_rel: 'FINANCIERA', lbl_hier: 'FINANCIERA', lvl: 1 }] as HierarquiaNodo[]))
      .mockReturnValueOnce(of([{ tip_cod: 4, cod_rel: 'Z1', des_rel: 'Zona 1', lbl_hier: 'ZONA', lvl: 2 }] as HierarquiaNodo[]));
    const fixture = crearSinInit({ code: 9, maxLvl: 3, dlgTitulo: 'x' });
    const nodoSpy = vi.fn();
    fixture.componentInstance.nodoSeleccionado.subscribe(nodoSpy);

    fixture.detectChanges();

    expect(nodoSpy).not.toHaveBeenCalled();
  });

  it('la raíz queda fijada y el nivel siguiente se ofrece sin preselección', () => {
    reportesFalso.obtenerJerarquiaBase.mockReturnValue(
      of([{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', lvl: 1 }] as HierarquiaNodo[])
    );
    reportesFalso.obtenerJerarquiaNivel
      .mockReturnValueOnce(of([{ tip_cod: 7, cod_rel: '231', des_rel: 'FINANCIERA', lbl_hier: 'FINANCIERA', lvl: 1 }] as HierarquiaNodo[]))
      .mockReturnValueOnce(of([{ tip_cod: 4, cod_rel: 'Z1', des_rel: 'Zona 1', lbl_hier: 'ZONA', lvl: 2 }] as HierarquiaNodo[]));
    const fixture = crear({ code: 9, maxLvl: 3, dlgTitulo: 'x' });
    const instancia = fixture.componentInstance;

    // Dos desplegables: la raíz y el nivel a elegir.
    expect(instancia['nodosNivel']().length).toBe(2);
    expect(instancia['valoresSeleccionados']()[0]?.des_rel).toBe('FINANCIERA');
    expect(instancia['valoresSeleccionados']()[1]).toBeNull();
  });

  it('elegir un nivel descarta los niveles que colgaban debajo', () => {
    reportesFalso.obtenerJerarquiaBase.mockReturnValue(
      of([{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', lvl: 1 }] as HierarquiaNodo[])
    );
    reportesFalso.obtenerJerarquiaNivel.mockReturnValue(
      of([{ tip_cod: 4, cod_rel: 'Z1', des_rel: 'Zona 1', lbl_hier: 'ZONA', lvl: 2 }] as HierarquiaNodo[])
    );
    const fixture = crear({ code: 9, maxLvl: 4, dlgTitulo: 'x' });
    const instancia = fixture.componentInstance;
    const nivelesAntes = instancia['nodosNivel']().length;

    instancia['onSeleccionarNivel'](0, { tip_cod: 7, cod_rel: '231', des_rel: 'FINANCIERA', lvl: 1 } as HierarquiaNodo);

    // Se conserva el nivel elegido y se repuebla el siguiente, nunca más.
    expect(instancia['nodosNivel']().length).toBeLessThanOrEqual(nivelesAntes);
    expect(instancia['nodosNivel']()[0].level).toBe(1);
  });
});
