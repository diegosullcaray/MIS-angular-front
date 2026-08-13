import { calcularPuedeGuardar, calcularPuedeVerificar, esCeldaEditable } from './linea-simple-reglas.util';
import type { HierarquiaNodo } from '../models/jerarquia.model';
import type { ResumenMetadata } from '../models/linea-simple.model';

function metadata(overrides: Partial<ResumenMetadata> = {}): ResumenMetadata {
  return { tip_cod_edi: 4, ord_ini_edi: 3, act_res: true, cod_sec: 'SEC-1', ...overrides };
}

function nodo(overrides: Partial<HierarquiaNodo> = {}): HierarquiaNodo {
  return { tip_cod: 4, cod_rel: 'A1', desc_rel: 'Agencia 1', ...overrides };
}

describe('calcularPuedeGuardar()', () => {
  it('es false sin metadata o sin nivel elegido', () => {
    expect(calcularPuedeGuardar(null, nodo(), false)).toBe(false);
    expect(calcularPuedeGuardar(metadata(), null, false)).toBe(false);
  });

  it('es true cuando el nivel activo es el editable Y el usuario es responsable vigente', () => {
    expect(calcularPuedeGuardar(metadata({ tip_cod_edi: 4, act_res: true }), nodo({ tip_cod: 4 }), false)).toBe(true);
  });

  it('es true cuando el nivel activo es el editable Y el usuario es admin (aunque no sea responsable)', () => {
    expect(calcularPuedeGuardar(metadata({ tip_cod_edi: 4, act_res: false }), nodo({ tip_cod: 4 }), true)).toBe(true);
  });

  it('es false si no es responsable ni admin', () => {
    expect(calcularPuedeGuardar(metadata({ tip_cod_edi: 4, act_res: false }), nodo({ tip_cod: 4 }), false)).toBe(false);
  });

  it('es false si el nivel activo no es el editable, aunque sea admin/responsable', () => {
    expect(calcularPuedeGuardar(metadata({ tip_cod_edi: 5, act_res: true }), nodo({ tip_cod: 4 }), true)).toBe(false);
  });
});

describe('calcularPuedeVerificar()', () => {
  it('es true cuando es admin/responsable pero el nivel activo NO es el editable', () => {
    expect(calcularPuedeVerificar(metadata({ tip_cod_edi: 5, act_res: false }), nodo({ tip_cod: 4 }), true)).toBe(true);
  });

  it('es false cuando puedeGuardar ya es true (no se muestran ambos botones)', () => {
    expect(calcularPuedeVerificar(metadata({ tip_cod_edi: 4, act_res: true }), nodo({ tip_cod: 4 }), false)).toBe(false);
  });

  it('es false sin permisos de admin/responsable', () => {
    expect(calcularPuedeVerificar(metadata({ tip_cod_edi: 5, act_res: false }), nodo({ tip_cod: 4 }), false)).toBe(false);
  });
});

describe('esCeldaEditable()', () => {
  it('columna fuera de inputCols nunca es editable', () => {
    const meta = metadata({ tip_cod_edi: 4, ord_ini_edi: 1 });
    expect(esCeldaEditable({ ord: 5, z: 1 }, 'z', ['a2'], meta, nodo({ tip_cod: 4 }), true)).toBe(false);
  });

  it('sin permisos de admin/responsable, ninguna columna es editable', () => {
    const meta = metadata({ tip_cod_edi: 4, ord_ini_edi: 1, act_res: false });
    expect(esCeldaEditable({ ord: 5, a2: 1 }, 'a2', ['a2'], meta, nodo({ tip_cod: 4 }), false)).toBe(false);
  });

  it('en el nivel editable, con permisos, y ord >= ord_ini_edi: la columna de inputCols es editable', () => {
    const meta = metadata({ tip_cod_edi: 4, ord_ini_edi: 3, act_res: true });
    expect(esCeldaEditable({ ord: 5, a2: 1 }, 'a2', ['a2'], meta, nodo({ tip_cod: 4 }), false)).toBe(true);
    expect(esCeldaEditable({ ord: 2, a2: 1 }, 'a2', ['a2'], meta, nodo({ tip_cod: 4 }), false)).toBe(false);
  });

  it('en un nivel distinto al editable, ninguna columna es editable', () => {
    const meta = metadata({ tip_cod_edi: 4, ord_ini_edi: 1, act_res: true });
    expect(esCeldaEditable({ ord: 5, a2: 1 }, 'a2', ['a2'], meta, nodo({ tip_cod: 9 }), false)).toBe(false);
  });

  it('inputCols "all": cualquier columna es editable desde ord_ini_edi en adelante, sin ventana corta', () => {
    const meta = metadata({ tip_cod_edi: 4, ord_ini_edi: 3, act_res: true });
    expect(esCeldaEditable({ ord: 10, cualquiera: 1 }, 'cualquiera', 'all', meta, nodo({ tip_cod: 4 }), false)).toBe(true);
    expect(esCeldaEditable({ ord: 2, cualquiera: 1 }, 'cualquiera', 'all', meta, nodo({ tip_cod: 4 }), false)).toBe(false);
  });

  it('Cartera Créditos: la 4ta columna de inputCols solo es editable dentro de [ord_ini_edi, ord_ini_edi_ASESPROD]', () => {
    const inputCols = ['b1', 'b3', 'b5', 'b2'];
    const meta = metadata({ tip_cod_edi: 4, ord_ini_edi: 1, ord_ini_edi_ASESPROD: 3, act_res: true });
    const n = nodo({ tip_cod: 4 });

    expect(esCeldaEditable({ ord: 2, b2: 1 }, 'b2', inputCols, meta, n, false)).toBe(true); // dentro de la ventana
    expect(esCeldaEditable({ ord: 5, b2: 1 }, 'b2', inputCols, meta, n, false)).toBe(false); // fuera → solo lectura
    expect(esCeldaEditable({ ord: 2, b1: 1 }, 'b1', inputCols, meta, n, false)).toBe(false); // 1ra col, dentro de la ventana → solo lectura
    expect(esCeldaEditable({ ord: 5, b1: 1 }, 'b1', inputCols, meta, n, false)).toBe(true); // 1ra col, fuera de la ventana → editable
  });
});
