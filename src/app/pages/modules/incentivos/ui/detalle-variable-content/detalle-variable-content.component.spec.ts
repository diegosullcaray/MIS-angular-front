import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DetalleVariableContentComponent } from './detalle-variable-content.component';
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

describe('DetalleVariableContentComponent', () => {
  let incentivosFalso: {
    perfil: ReturnType<typeof signal<PerfilUsuarioIncentivo | null>>;
    nivelActual: ReturnType<typeof signal<NivelSeleccionado | null>>;
    obtenerDetalleVariable: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    incentivosFalso = {
      perfil: signal<PerfilUsuarioIncentivo | null>({ nombre: 'Juan Pérez', nivel: 'CARGO', descripcionNivel: 'Asesor de Negocios', imagenUrl: '' }),
      nivelActual: signal<NivelSeleccionado | null>({ tipCod: 1, codRel: 'BT-001', claUsu: 1 }),
      obtenerDetalleVariable: vi.fn().mockReturnValue(of(resultado())),
    };
    TestBed.configureTestingModule({
      imports: [DetalleVariableContentComponent],
      providers: [{ provide: IncentivosService, useValue: incentivosFalso }, MessageService],
    });
  });

  function crear(props: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(DetalleVariableContentComponent);
    fixture.componentRef.setInput('activo', true);
    Object.entries(props).forEach(([k, v]) => fixture.componentRef.setInput(k, v));
    fixture.detectChanges();
    return fixture;
  }

  it('al activarse, pide el detalle del nivel actual y arma el primer frame de la pila', () => {
    const fixture = crear({ req: 'getDetail', codVar: 91 });

    expect(incentivosFalso.obtenerDetalleVariable).toHaveBeenCalledWith('getDetail', 1, 'BT-001', 91);
    expect(fixture.componentInstance['frameActual']()?.desRel).toBe('Juan Pérez');
    expect(fixture.componentInstance['frameActual']()?.desLab).toBe('Asesor');
    expect(fixture.componentInstance['puedeVolver']()).toBe(false);
  });

  it('Tasas de un asesor: pide getTasa con su propio código y se encabeza "Asesor: {nombre}", no con el cargo', () => {
    const fixture = crear({ req: 'getTasa', codVar: 6 });

    expect(incentivosFalso.obtenerDetalleVariable).toHaveBeenCalledWith('getTasa', 1, 'BT-001', 6);
    expect(fixture.componentInstance['frameActual']()?.desLab).toBe('Asesor');
    expect(fixture.componentInstance['frameActual']()?.desRel).toBe('Juan Pérez');
    expect(fixture.componentInstance['encabezadosRanking']().real).toBe('Tasa Mes');
    expect(fixture.componentInstance['formatosRanking']().distancia).toBe('pbs');
  });

  it('varsMostradas() filtra por el bloqueActivo del frame (1 al abrir)', () => {
    const fixture = crear();
    expect(fixture.componentInstance['varsMostradas']().map((v) => v.des_var)).toEqual(['Var 1', 'Var 2']);
  });

  it('toggleBloque() con cod_bdd expande sus sub-indicadores en línea, sin tocar la pila ni pedir nada al backend', () => {
    const fixture = crear();
    const filaConBloque = resultado().vars[1]; // 'Var 2', cod_bdd=2

    fixture.componentInstance['toggleBloque'](filaConBloque);

    expect(fixture.componentInstance['puedeVolver']()).toBe(false);
    expect(fixture.componentInstance['bloqueExpandido']()).toBe(2);
    expect(fixture.componentInstance['subVars'](2).map((v) => v.des_var)).toEqual(['Sub var']);
    expect(fixture.componentInstance['varsMostradas']().map((v) => v.des_var)).toEqual(['Var 1', 'Var 2']); // la raíz no cambia
    expect(incentivosFalso.obtenerDetalleVariable).toHaveBeenCalledTimes(1); // no pidió nada nuevo al backend

    fixture.componentInstance['toggleBloque'](filaConBloque); // un segundo clic colapsa
    expect(fixture.componentInstance['bloqueExpandido']()).toBeNull();
  });

  it('toggleBloque() sin cod_bdd no hace nada', () => {
    const fixture = crear();
    const filaSinBloque = resultado().vars[0];

    fixture.componentInstance['toggleBloque'](filaSinBloque);

    expect(fixture.componentInstance['bloqueExpandido']()).toBeNull();
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
    fixture.componentInstance['drillRanking'](resultado().rank[0]);
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

  it('formatearCelda() usa el fmt de la fila como el dynamicFormatPipe del legado (percent con 2 decimales, pbs ×10.000)', () => {
    const fixture = crear();
    expect(fixture.componentInstance['formatearCelda'](0.5, 'percent')).toBe('50.00%');
    expect(fixture.componentInstance['formatearCelda'](0.0125, 'pbs')).toBe('125 pbs');
    expect(fixture.componentInstance['formatearCelda'](-0.003, 'pbs')).toBe('-30 pbs');
    expect(fixture.componentInstance['formatearCelda'](100, 'pen')).toBe('S/. 100');
    expect(fixture.componentInstance['formatearCelda'](3.456, 'decimal')).toBe('3.46');
    expect(fixture.componentInstance['formatearCelda'](1234.6, undefined)).toBe('1,235');
    expect(fixture.componentInstance['formatearCelda'](undefined, 'percent')).toBe('');
  });

  it('colorCelda() solo pinta en magenta la fila tas_diff negativa (csFn2 del legado)', () => {
    const fixture = crear();
    const c = fixture.componentInstance;
    expect(c['colorCelda']({ des_var: 'Distancia', cod_var: 'tas_diff', cod_block: 1 }, -0.002)).toBe('var(--mis-inc-negativo)');
    expect(c['colorCelda']({ des_var: 'Distancia', cod_var: 'tas_diff', cod_block: 1 }, 0.002)).toBeNull();
    expect(c['colorCelda']({ des_var: 'Tasa Mes', cod_var: 'tas_mes', cod_block: 1 }, -1)).toBeNull();
    expect(c['colorDistancia'](-5)).toBe('var(--mis-inc-negativo)');
    expect(c['colorDistancia'](5)).toBeNull();
  });

  it('si falla la carga, muestra un toast de error', () => {
    incentivosFalso.obtenerDetalleVariable.mockReturnValue(throwError(() => new Error('caído')));
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    crear();

    expect(errorSpy).toHaveBeenCalled();
  });
});
