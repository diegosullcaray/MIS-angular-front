import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DepositoBpComponent } from './deposito-bp.component';
import { PresupuestoService } from '../../services/presupuesto.service';
import { calcularFilaDeposito } from '../../utils/deposito-calculo.util';

describe('DepositoBpComponent', () => {
  let presupuestoFalso: {
    obtenerResumenDepBP: ReturnType<typeof vi.fn>;
    guardarResumenDepBP: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    presupuestoFalso = {
      obtenerResumenDepBP: vi.fn().mockReturnValue(of({ ws: [], bp: {} })),
      guardarResumenDepBP: vi.fn().mockReturnValue(of({})),
    };
    TestBed.configureTestingModule({
      imports: [DepositoBpComponent],
      providers: [{ provide: PresupuestoService, useValue: presupuestoFalso }],
    });
  });

  it('arma la config con la jerarquía y las columnas de Banca Preferente', () => {
    const fixture = TestBed.createComponent(DepositoBpComponent);
    fixture.detectChanges();
    const config = fixture.componentInstance['config'];

    expect(config.mainTitle).toBe('Depósitos Banca Preferente');
    expect(config.paramsHier).toEqual({ code: 7, maxLvl: 2, dlgTitulo: 'JERARQUIA BANCA PREF.' });
    expect(config.inputCols).toEqual(['a2', 'b2', 'c2']);
    expect(config.calcularFila).toBe(calcularFilaDeposito);
  });

  it('obtenerResumen()/guardarResumen() delegan en PresupuestoService.*DepBP()', () => {
    const fixture = TestBed.createComponent(DepositoBpComponent);
    fixture.detectChanges();
    const config = fixture.componentInstance['config'];

    config.obtenerResumen(7, 'A1').subscribe();
    expect(presupuestoFalso.obtenerResumenDepBP).toHaveBeenCalledWith(7, 'A1');

    config.guardarResumen(7, 'A1', []).subscribe();
    expect(presupuestoFalso.guardarResumenDepBP).toHaveBeenCalledWith(7, 'A1', []);
  });
});
