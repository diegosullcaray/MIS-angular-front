import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SegurosOperacionesComponent } from './seguros-operaciones.component';
import { PresupuestoService } from '../../services/presupuesto.service';

describe('SegurosOperacionesComponent', () => {
  let presupuestoFalso: {
    obtenerResumenSegOperaciones: ReturnType<typeof vi.fn>;
    guardarResumenSegOperaciones: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    presupuestoFalso = {
      obtenerResumenSegOperaciones: vi.fn().mockReturnValue(of({ ws: [], bp: {} })),
      guardarResumenSegOperaciones: vi.fn().mockReturnValue(of({})),
    };
    TestBed.configureTestingModule({
      imports: [SegurosOperacionesComponent],
      providers: [{ provide: PresupuestoService, useValue: presupuestoFalso }],
    });
  });

  it('arma la config con las columnas de negocio propias (no siguen el patrón a1/a2/...)', () => {
    const fixture = TestBed.createComponent(SegurosOperacionesComponent);
    fixture.detectChanges();
    const config = fixture.componentInstance['config'];

    expect(config.mainTitle).toBe('Seguros Operaciones');
    expect(config.paramsHier).toEqual({ code: 2, maxLvl: 4, dlgTitulo: 'JERARQUIA AGENCIA DEP.' });
    expect(config.inputCols).toBe('all');
    expect(config.columnas.map((c) => c.key)).toContain('seg_ope_onco_ahorros');
  });

  it('obtenerResumen()/guardarResumen() delegan en PresupuestoService.*SegOperaciones()', () => {
    const fixture = TestBed.createComponent(SegurosOperacionesComponent);
    fixture.detectChanges();
    const config = fixture.componentInstance['config'];

    config.obtenerResumen(2, 'A1').subscribe();
    expect(presupuestoFalso.obtenerResumenSegOperaciones).toHaveBeenCalledWith(2, 'A1');

    config.guardarResumen(2, 'A1', []).subscribe();
    expect(presupuestoFalso.guardarResumenSegOperaciones).toHaveBeenCalledWith(2, 'A1', []);
  });
});
