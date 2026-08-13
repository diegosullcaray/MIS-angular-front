import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { SegurosComercialComponent } from './seguros-comercial.component';
import { PresupuestoService } from '../../../services/presupuesto.service';

describe('SegurosComercialComponent', () => {
  let presupuestoFalso: {
    esAdmin: ReturnType<typeof vi.fn>;
    obtenerResumenSegComercial: ReturnType<typeof vi.fn>;
    guardarResumenSegComercial: ReturnType<typeof vi.fn>;
    obtenerJerarquiaBase: ReturnType<typeof vi.fn>;
    obtenerJerarquiaNivel: ReturnType<typeof vi.fn>;
    fechaCorte: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    presupuestoFalso = {
      esAdmin: vi.fn().mockReturnValue(false),
      obtenerResumenSegComercial: vi.fn().mockReturnValue(of({ ws: [], bp: {} })),
      guardarResumenSegComercial: vi.fn().mockReturnValue(of({})),
      obtenerJerarquiaBase: vi.fn().mockReturnValue(of([])),
      obtenerJerarquiaNivel: vi.fn().mockReturnValue(of([])),
      fechaCorte: vi.fn().mockReturnValue('2026-01-01'),
    };
    TestBed.configureTestingModule({
      imports: [SegurosComercialComponent],
      providers: [{ provide: PresupuestoService, useValue: presupuestoFalso }, MessageService],
    });
  });

  it('arma la config sin fórmula derivada y con inputCols "all" (todas las columnas editables)', () => {
    const fixture = TestBed.createComponent(SegurosComercialComponent);
    fixture.detectChanges();
    const config = fixture.componentInstance['config'];

    expect(config.mainTitle).toBe('Seguros Comercial');
    expect(config.paramsHier).toEqual({ code: 9, maxLvl: 5, dlgTitulo: 'JERARQUIA ADMIN. COMER.' });
    expect(config.inputCols).toBe('all');
    expect(config.calcularFila).toBeUndefined();
  });

  it('obtenerResumen()/guardarResumen() delegan en PresupuestoService.*SegComercial()', () => {
    const fixture = TestBed.createComponent(SegurosComercialComponent);
    fixture.detectChanges();
    const config = fixture.componentInstance['config'];

    config.obtenerResumen(9, 'A1').subscribe();
    expect(presupuestoFalso.obtenerResumenSegComercial).toHaveBeenCalledWith(9, 'A1');

    config.guardarResumen(9, 'A1', []).subscribe();
    expect(presupuestoFalso.guardarResumenSegComercial).toHaveBeenCalledWith(9, 'A1', []);
  });
});
