import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import type { TreeNode } from 'primeng/api';
import { HierSelectorComponent } from './hier-selector.component';
import { PresupuestoService } from '../../services/presupuesto.service';
import type { HierarquiaNodo, ParamsJerarquia } from '../../models';

const PARAMS: ParamsJerarquia = { code: 9, maxLvl: 2, dlgTitulo: 'JERARQUIA ADMIN. COMER.' };

describe('HierSelectorComponent', () => {
  let presupuestoFalso: {
    obtenerJerarquiaBase: ReturnType<typeof vi.fn>;
    obtenerJerarquiaNivel: ReturnType<typeof vi.fn>;
    fechaCorte: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    presupuestoFalso = {
      obtenerJerarquiaBase: vi.fn().mockReturnValue(of([] as HierarquiaNodo[])),
      obtenerJerarquiaNivel: vi.fn().mockReturnValue(of([] as HierarquiaNodo[])),
      fechaCorte: vi.fn().mockReturnValue('2026-08-05'),
    };

    TestBed.configureTestingModule({
      imports: [HierSelectorComponent],
      providers: [{ provide: PresupuestoService, useValue: presupuestoFalso }],
    });
  });

  function crear(params: ParamsJerarquia = PARAMS) {
    const fixture = TestBed.createComponent(HierSelectorComponent);
    fixture.componentRef.setInput('paramsHier', params);
    fixture.detectChanges();
    return fixture;
  }

  it('abrir() carga la jerarquía base una sola vez, aunque se abra el diálogo varias veces', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;

    instancia['abrir']();
    instancia['dialogAbierto'].set(false);
    instancia['abrir']();

    expect(presupuestoFalso.obtenerJerarquiaBase).toHaveBeenCalledTimes(1);
    expect(presupuestoFalso.obtenerJerarquiaBase).toHaveBeenCalledWith(9);
  });

  it('convierte la jerarquía base en nodos de árbol, marcando hoja cuando el nivel alcanza maxLvl', () => {
    presupuestoFalso.obtenerJerarquiaBase.mockReturnValue(
      of([{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza' }] as HierarquiaNodo[])
    );
    const fixture = crear({ code: 9, maxLvl: 1, dlgTitulo: 'x' }); // raíz = nivel 1 = maxLvl → ya es hoja

    fixture.componentInstance['abrir']();

    const nodos = fixture.componentInstance['nodos']();
    expect(nodos).toEqual([
      { key: '1-7-231', label: 'Financiera Confianza', data: { tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', lvl: 1 }, leaf: true },
    ]);
  });

  it('onExpandir() pide el siguiente nivel con el tip_cod/cod_rel del nodo y arma sus hijos', () => {
    presupuestoFalso.obtenerJerarquiaNivel.mockReturnValue(
      of([{ tip_cod: 4, cod_rel: 'A1', desc_rel: 'Agencia 1' }] as HierarquiaNodo[])
    );
    const fixture = crear({ code: 9, maxLvl: 3, dlgTitulo: 'x' });
    const arbol: TreeNode<HierarquiaNodo> = {
      key: '1-7-231', label: 'Financiera Confianza',
      data: { tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', lvl: 1 },
      leaf: false,
    };

    fixture.componentInstance['onExpandir']({ originalEvent: new Event('expand'), node: arbol });

    expect(presupuestoFalso.obtenerJerarquiaNivel).toHaveBeenCalledWith(9, 2, 7, ['231'], { key: 'fec', val: '2026-08-05' });
    expect(arbol.children).toEqual([
      { key: '2-4-A1', label: 'Agencia 1', data: { tip_cod: 4, cod_rel: 'A1', desc_rel: 'Agencia 1', lvl: 2 }, leaf: false },
    ]);
    expect(arbol.loading).toBe(false);
  });

  it('onExpandir() no vuelve a pedir hijos si el nodo ya es hoja', () => {
    const fixture = crear();
    const hoja: TreeNode<HierarquiaNodo> = {
      key: '2-4-A1', label: 'Agencia 1',
      data: { tip_cod: 4, cod_rel: 'A1', desc_rel: 'Agencia 1', lvl: 2 },
      leaf: true,
    };

    fixture.componentInstance['onExpandir']({ originalEvent: new Event('expand'), node: hoja });

    expect(presupuestoFalso.obtenerJerarquiaNivel).not.toHaveBeenCalled();
  });

  it('onSeleccionar() cierra el diálogo, fija la etiqueta y emite el nodo elegido', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;
    const emitSpy = vi.fn();
    instancia.nodoSeleccionado.subscribe(emitSpy);
    instancia['dialogAbierto'].set(true);

    const nodo: HierarquiaNodo = { tip_cod: 4, cod_rel: 'A1', desc_rel: 'Agencia 1', lvl: 2 };
    instancia['onSeleccionar']({ originalEvent: new Event('select'), node: { key: 'k', label: 'Agencia 1', data: nodo } });

    expect(instancia['dialogAbierto']()).toBe(false);
    expect(instancia['etiquetaActual']()).toBe('Agencia 1');
    expect(emitSpy).toHaveBeenCalledWith(nodo);
  });

  it('seleccionarRaiz() cierra el diálogo, fija la etiqueta y emite el nodo raíz sin necesidad de expandir', () => {
    presupuestoFalso.obtenerJerarquiaBase.mockReturnValue(
      of([{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza' }] as HierarquiaNodo[])
    );
    const fixture = crear();
    const instancia = fixture.componentInstance;
    const emitSpy = vi.fn();
    instancia.nodoSeleccionado.subscribe(emitSpy);

    instancia['abrir']();
    instancia['seleccionarRaiz']();

    expect(instancia['dialogAbierto']()).toBe(false);
    expect(instancia['etiquetaActual']()).toBe('Financiera Confianza');
    expect(emitSpy).toHaveBeenCalledWith({ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', lvl: 1 });
  });

  it('seleccionarRaiz() no hace nada si la raíz todavía no cargó', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;
    const emitSpy = vi.fn();
    instancia.nodoSeleccionado.subscribe(emitSpy);

    instancia['seleccionarRaiz']();

    expect(emitSpy).not.toHaveBeenCalled();
  });
});
