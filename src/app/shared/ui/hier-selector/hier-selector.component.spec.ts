import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HierSelectorComponent } from './hier-selector.component';
import { ModSysAdminService } from '../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../core/services/shell-state.service';
import type { HierarquiaNodo, ParamsJerarquia } from './jerarquia.model';

const PARAMS: ParamsJerarquia = { code: 9, maxLvl: 2, dlgTitulo: 'JERARQUIA UNIDAD' };
const RAIZ: HierarquiaNodo = { tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', lvl: 1 };

/** Respuesta de Winder tal como la envuelve `ModSysAdminService`. */
const respuesta = (clave: 'base_hierarchy' | 'level_hierarchy', nodos: HierarquiaNodo[]) =>
  of({ code: '0', headers: {}, body: { [clave]: nodos } } as never);

describe('HierSelectorComponent', () => {
  let antAdmin: {
    getBaseHierarchy: ReturnType<typeof vi.fn>;
    getLevelHierarchy: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    antAdmin = {
      getBaseHierarchy: vi.fn().mockReturnValue(respuesta('base_hierarchy', [RAIZ])),
      getLevelHierarchy: vi.fn().mockReturnValue(respuesta('level_hierarchy', [RAIZ])),
    };

    // El caché de jerarquía persiste en `sessionStorage`: sin vaciarlo, un test
    // le serviría a otro el árbol ya resuelto y nadie pediría nada.
    sessionStorage.clear();

    TestBed.configureTestingModule({
      imports: [HierSelectorComponent],
      providers: [{ provide: ModSysAdminService, useValue: antAdmin }, ShellStateService],
    });
  });

  function crear(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(HierSelectorComponent);
    fixture.componentRef.setInput('paramsHier', PARAMS);
    for (const [clave, valor] of Object.entries(inputs)) {
      fixture.componentRef.setInput(clave, valor);
    }
    fixture.detectChanges();
    return fixture;
  }

  it('se inicializa pidiendo la raíz de la jerarquía configurada', () => {
    crear();
    expect(antAdmin.getBaseHierarchy).toHaveBeenCalledWith('', 9);
  });

  it('pide cada nivel con el filtro de fecha de corte', () => {
    crear();
    const params = antAdmin.getLevelHierarchy.mock.calls[0][4];
    expect(params).toMatchObject({ key: 'fec' });
    expect(params.val).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('con raizFija se saltea `base_hier` y arranca directo en el nivel', () => {
    crear({ raizFija: [RAIZ] });
    expect(antAdmin.getBaseHierarchy).not.toHaveBeenCalled();
    expect(antAdmin.getLevelHierarchy).toHaveBeenCalled();
  });

  it('emite la ruta seleccionada al cargar la raíz', () => {
    const fixture = crear();
    const rutas: HierarquiaNodo[][] = [];
    fixture.componentInstance.rutaSeleccionada.subscribe((r) => rutas.push(r));
    fixture.componentInstance.limpiar();
    expect(rutas.at(-1)).toEqual([expect.objectContaining({ cod_rel: '231' })]);
  });

  it('sin reintentarSinFecha, un nivel vacío no dispara una segunda llamada', () => {
    antAdmin.getLevelHierarchy.mockReturnValue(respuesta('level_hierarchy', []));
    crear();
    expect(antAdmin.getLevelHierarchy).toHaveBeenCalledTimes(1);
  });

  it('con reintentarSinFecha, un nivel vacío se reintenta sin el filtro de fecha', () => {
    antAdmin.getLevelHierarchy.mockReturnValue(respuesta('level_hierarchy', []));
    crear({ reintentarSinFecha: true });

    expect(antAdmin.getLevelHierarchy).toHaveBeenCalledTimes(2);
    expect(antAdmin.getLevelHierarchy.mock.calls[1][4]).toBeUndefined();
  });

  it('emite error() si la raíz no se puede cargar', () => {
    antAdmin.getBaseHierarchy.mockReturnValue(throwError(() => new Error('falló')));
    const fixture = crear();
    const errorSpy = vi.fn();
    fixture.componentInstance.error.subscribe(errorSpy);
    fixture.componentInstance.limpiar();
    expect(errorSpy).toHaveBeenCalled();
  });
});
