import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DetalleVariableDialogComponent } from './detalle-variable-dialog.component';
import { IncentivosService } from '../../services/incentivos.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { NivelSeleccionado, PerfilUsuarioIncentivo, ResultadoDetalleVariable } from '../../models';

function resultado(overrides: Partial<ResultadoDetalleVariable> = {}): ResultadoDetalleVariable {
  return {
    card: { cie_real: 100, var_real: 10, met: 90, exis_met: 1, avan: 1.1, f1: 'Ene', f2: 'Feb', blocks: 2 },
    vars: [
      { des_var: 'Var 1', cod_block: 1, f1: 10, f2: 20, diff: 10 },
      { des_var: 'Var 2', cod_block: 1, cod_bdd: 2, f1: 5, f2: 8, diff: 3 },
      { des_var: 'Sub var', cod_block: 2, f1: 1, f2: 2, diff: 1 },
    ],
    rank: [{ des_rel: 'Agencia 1', tip_cod: 18, cod_rel: 'U-01', var_real: 50, met: 40, diff: 10 }],
    ...overrides,
  };
}

describe('DetalleVariableDialogComponent', () => {
  let incentivosFalso: {
    perfil: ReturnType<typeof signal<PerfilUsuarioIncentivo | null>>;
    nivelActual: ReturnType<typeof signal<NivelSeleccionado | null>>;
    obtenerDetalleVariable: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    incentivosFalso = {
      perfil: signal<PerfilUsuarioIncentivo | null>({ nombre: 'Juan Pérez', nivel: 'CARGO', descripcionNivel: 'Asesor', imagenUrl: '' }),
      nivelActual: signal<NivelSeleccionado | null>({ tipCod: 1, codRel: 'BT-001', claUsu: 1 }),
      obtenerDetalleVariable: vi.fn().mockReturnValue(of(resultado())),
    };
    TestBed.configureTestingModule({
      imports: [DetalleVariableDialogComponent],
      providers: [{ provide: IncentivosService, useValue: incentivosFalso }, MessageService],
    });
  });

  function crear(props: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(DetalleVariableDialogComponent);
    fixture.componentRef.setInput('visible', true);
    Object.entries(props).forEach(([k, v]) => fixture.componentRef.setInput(k, v));
    fixture.detectChanges();
    return fixture;
  }

  it('al abrirse, pide el detalle del nivel actual y arma el primer frame de la pila', () => {
    const fixture = crear({ req: 'getDetail', codVar: 91 });

    expect(incentivosFalso.obtenerDetalleVariable).toHaveBeenCalledWith('getDetail', 1, 'BT-001', 91);
    expect(fixture.componentInstance['frameActual']()?.desRel).toBe('Juan Pérez');
    expect(fixture.componentInstance['frameActual']()?.desLab).toBe('Asesor');
    expect(fixture.componentInstance['puedeVolver']()).toBe(false);
  });

  it('varsMostradas() filtra por el bloqueActivo del frame (1 al abrir)', () => {
    const fixture = crear();
    expect(fixture.componentInstance['varsMostradas']().map((v) => v.des_var)).toEqual(['Var 1', 'Var 2']);
  });

  it('drillBloque() con cod_bdd empuja un frame con el mismo resultado y el bloque filtrado', () => {
    const fixture = crear();
    const filaConBloque = resultado().vars[1]; // 'Var 2', cod_bdd=2

    fixture.componentInstance['drillBloque'](filaConBloque);

    expect(fixture.componentInstance['puedeVolver']()).toBe(true);
    expect(fixture.componentInstance['varsMostradas']().map((v) => v.des_var)).toEqual(['Sub var']);
    expect(incentivosFalso.obtenerDetalleVariable).toHaveBeenCalledTimes(1); // no pidió nada nuevo al backend
  });

  it('drillBloque() sin cod_bdd no hace nada', () => {
    const fixture = crear();
    const filaSinBloque = resultado().vars[0];

    fixture.componentInstance['drillBloque'](filaSinBloque);

    expect(fixture.componentInstance['puedeVolver']()).toBe(false);
  });

  it('drillRanking() pide un nuevo detalle para el tip_cod/cod_rel elegido y lo apila', () => {
    incentivosFalso.obtenerDetalleVariable.mockReturnValueOnce(of(resultado())).mockReturnValueOnce(of(resultado({ card: { ...resultado().card, f2: 'Mar' } })));
    const fixture = crear();

    fixture.componentInstance['drillRanking'](resultado().rank[0]);

    expect(incentivosFalso.obtenerDetalleVariable).toHaveBeenCalledTimes(2);
    expect(incentivosFalso.obtenerDetalleVariable).toHaveBeenLastCalledWith('getDetail', 18, 'U-01', 0);
    expect(fixture.componentInstance['frameActual']()?.desRel).toBe('Agencia 1');
    expect(fixture.componentInstance['frameActual']()?.desLab).toBe('Unidad');
    expect(fixture.componentInstance['puedeVolver']()).toBe(true);
  });

  it('volver() saca el último frame de la pila (no hace nada si solo queda uno)', () => {
    const fixture = crear();
    fixture.componentInstance['drillBloque'](resultado().vars[1]);
    expect(fixture.componentInstance['puedeVolver']()).toBe(true);

    fixture.componentInstance['volver']();
    expect(fixture.componentInstance['puedeVolver']()).toBe(false);

    fixture.componentInstance['volver'](); // no debe romper con un solo frame
    expect(fixture.componentInstance['pila']()).toHaveLength(1);
  });

  it('muestraBotonesToggle() es false para tip_cod=1 (individual)', () => {
    const fixture = crear();
    expect(fixture.componentInstance['muestraBotonesToggle']()).toBe(false);
  });

  it('muestraBotonesToggle() es true para un nivel jerárquico (no individual)', () => {
    incentivosFalso.nivelActual.set({ tipCod: 18, codRel: 'U-01', claUsu: 1 });
    const fixture = crear();
    expect(fixture.componentInstance['muestraBotonesToggle']()).toBe(true);
  });

  it('formatearValorTarjeta() usa moneda para el slot 1, entero para el slot 2, porcentaje para el resto (typ cv)', () => {
    const fixture = crear({ req: 'getDetail', codVar: 91 });
    expect(fixture.componentInstance['formatearValorTarjeta'](1234)).toBe('S/. 1,234');

    fixture.componentRef.setInput('codVar', 2);
    fixture.detectChanges();
    expect(fixture.componentInstance['formatearValorTarjeta'](1234)).toBe('1,234');

    fixture.componentRef.setInput('codVar', 4);
    fixture.detectChanges();
    expect(fixture.componentInstance['formatearValorTarjeta'](0.5)).toBe('50%');
  });

  it('formatearValorTarjeta() siempre usa decimal para req="getProd" (typ sp)', () => {
    const fixture = crear({ req: 'getProd', codVar: 1 });
    expect(fixture.componentInstance['formatearValorTarjeta'](12.3456)).toBe('12.35');
  });

  it('formatearMeta() devuelve "--" si el card no tiene meta configurada (exis_met=0)', () => {
    incentivosFalso.obtenerDetalleVariable.mockReturnValue(of(resultado({ card: { ...resultado().card, exis_met: 0 } })));
    const fixture = crear({ req: 'getDetail', codVar: 91 });

    expect(fixture.componentInstance['formatearMeta']()).toBe('--');
  });

  it('formatearCelda() aplica formato percent/pen/decimal, o "--" si el valor es nulo', () => {
    const fixture = crear();
    expect(fixture.componentInstance['formatearCelda'](0.5, 'percent')).toBe('50%');
    expect(fixture.componentInstance['formatearCelda'](100, 'pen')).toBe('S/. 100');
    expect(fixture.componentInstance['formatearCelda'](undefined, 'percent')).toBe('--');
  });

  it('si falla la carga, muestra un toast de error', () => {
    incentivosFalso.obtenerDetalleVariable.mockReturnValue(throwError(() => new Error('caído')));
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    crear();

    expect(errorSpy).toHaveBeenCalled();
  });

  it('cerrar() emite visibleChange(false)', () => {
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.visibleChange.subscribe(emitido);

    fixture.componentInstance['cerrar']();

    expect(emitido).toHaveBeenCalledWith(false);
  });
});
