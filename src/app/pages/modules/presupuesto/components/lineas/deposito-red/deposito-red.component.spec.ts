import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DepositoRedComponent } from './deposito-red.component';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { calcularFilaDeposito } from '../../../utils/deposito-calculo.util';

describe('DepositoRedComponent', () => {
  let presupuestoFalso: {
    esAdmin: ReturnType<typeof vi.fn>;
    obtenerResumenDepRed: ReturnType<typeof vi.fn>;
    guardarResumenDepRed: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    presupuestoFalso = {
      esAdmin: vi.fn().mockReturnValue(false),
      obtenerResumenDepRed: vi.fn().mockReturnValue(of({ ws: [], bp: {} })),
      guardarResumenDepRed: vi.fn().mockReturnValue(of({})),
    };
    TestBed.configureTestingModule({
      imports: [DepositoRedComponent],
      providers: [{ provide: PresupuestoService, useValue: presupuestoFalso }, MessageService],
    });
  });

  it('arma la config con la jerarquía de Agencia Dep. y comparte la fórmula de Depósitos', () => {
    const fixture = TestBed.createComponent(DepositoRedComponent);
    fixture.detectChanges();
    const config = fixture.componentInstance['config'];

    expect(config.mainTitle).toBe('Depósitos Red');
    expect(config.paramsHier).toEqual({ code: 2, maxLvl: 4, dlgTitulo: 'JERARQUIA AGENCIA DEP.' });
    expect(config.inputCols).toEqual(['a2', 'b2', 'c2']);
    expect(config.calcularFila).toBe(calcularFilaDeposito);
  });

  it('obtenerResumen()/guardarResumen() delegan en PresupuestoService.*DepRed()', () => {
    const fixture = TestBed.createComponent(DepositoRedComponent);
    fixture.detectChanges();
    const config = fixture.componentInstance['config'];

    config.obtenerResumen(2, 'A1').subscribe();
    expect(presupuestoFalso.obtenerResumenDepRed).toHaveBeenCalledWith(2, 'A1');

    config.guardarResumen(2, 'A1', []).subscribe();
    expect(presupuestoFalso.guardarResumenDepRed).toHaveBeenCalledWith(2, 'A1', []);
  });
});
