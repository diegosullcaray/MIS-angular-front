import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HierSelectorComponent } from './hier-selector.component';
import { PresupuestoService } from '../../services/presupuesto.service';
import type { HierarquiaNodo, ParamsJerarquia } from '../../models/jerarquia.model';

const PARAMS: ParamsJerarquia = { code: 9, maxLvl: 2, dlgTitulo: 'JERARQUIA ADMIN. COMER.' };

describe('HierSelectorComponent', () => {
  let presupuestoFalso: {
    obtenerJerarquiaBase: ReturnType<typeof vi.fn>;
    obtenerJerarquiaNivel: ReturnType<typeof vi.fn>;
    fechaCorte: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    presupuestoFalso = {
      obtenerJerarquiaBase: vi.fn().mockReturnValue(of([{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', lvl: 1 } as HierarquiaNodo])),
      obtenerJerarquiaNivel: vi.fn().mockReturnValue(of([{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', lvl: 1 } as HierarquiaNodo])),
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

  it('se inicializa y carga la raíz organizativa', () => {
    crear();
    expect(presupuestoFalso.obtenerJerarquiaBase).toHaveBeenCalledWith(9);
  });

  it('limpiar() restablece las selecciones de nivel', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;
    instancia.limpiar();
    expect(presupuestoFalso.obtenerJerarquiaBase).toHaveBeenCalled();
  });
});
