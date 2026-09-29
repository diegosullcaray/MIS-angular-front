import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';
import { TABLA_PENDIENTE } from '../../../models/tabla-reporte.model';
import { CODIGO_CLIENTES_CONSOLIDADO } from '../constantes/panel-asesor.constantes';
import { hallarFila, normalizar, numeroDe, resumenDominio, type ResultadosPanel } from './panel-resumen.util';

type Celda = string | number | null;

/** Tabla como la manda el motor: primera columna de datos = etiqueta de la fila. */
function tabla(encabezados: string[], filas: Celda[][], numericas: number[] = []): TablaReporteResultado {
  const columns = encabezados.map((header, i) => ({
    columnDef: `c${i}`,
    header,
    isdata: i + 1,
    ...(numericas.includes(i) ? { format: { type: 'number' } } : {}),
  }));
  return { headers: [{ columns }], body: filas.map((f) => Object.fromEntries(f.map((v, i) => [`c${i}`, v]))), additional: {} };
}

const EVOLUCION = tabla(
  ['Variable', 'Cierre mes ant.', 'Ejecutado', 'Variación'],
  [
    ['Stock de cartera', 3528967, 3254743, -274224],
    ['Saldo medio de cartera', 3446945, 1775379, -1671566],
    ['TAPP stock', '23.09%', '23.32%', '23 pbs'],
    ['Número de clientes en mora', 1, 5, 4],
    ['Clientes en mora tramo 1 a 30 días', 1, 4, 3],
    ['Saldo en mora tramo 1 a 30 días', 71499, 95197, 23698],
  ],
  [1, 2, 3],
);
const PRESUPUESTO = tabla(
  ['Variable', 'Presupuesto', 'Ejecutado'],
  [
    ['Ratio de efectividad tramo −30 a 0 días', '—', '95.94%'],
    ['Ratio de efectividad tramo 1 a 30 días', '—', '0.00%'],
  ],
);
const CLIENTES = tabla(
  ['Variable', 'Cierre mes ant.', 'A hoy', 'Variación'],
  [
    ['Número de clientes nuevos', 2, 2, 0],
    ['Número de clientes recurrentes', 20, 6, -14],
  ],
  [1, 2, 3],
);
const TASAS = tabla(
  ['Rubro', 'Encima mín.', 'Administr.', 'Total'],
  [
    ['Nro. operaciones', 0, 5, 5],
    ['TAPP mes (%)', '0.00%', '52.98%', '52.98%'],
    ['TAPP mínima referencial (%)', '0.00%', '55.76%', '55.76%'],
    ['Distancia (pbs)', 0, -277, -277],
  ],
  [1, 2, 3],
);
const MONITOR = tabla(
  ['Día', 'Ops acum.', 'Meta acum.', '% días'],
  [
    ['1', 0, 15, '3.85%'],
    ['24', 8, 15, '96.15%'],
  ],
  [1, 2],
);

const RESULTADOS: ResultadosPanel = {
  L_CART_SEC: { tabla1: PRESUPUESTO, tabla2: EVOLUCION },
  [CODIGO_CLIENTES_CONSOLIDADO]: { tabla2: CLIENTES },
  L_REP_AUTO_SEC: { tabla1: TASAS },
  L_MONI_DESE_SEC: {
    tabla1: MONITOR,
    kpiOperaciones: { fecha: '29/09/2026', cumpl_des_acum: '53.33%' },
    kpiMonto: { cumpl_ope_acum: '6.51%' },
  },
};
const CORTE = new Date(2026, 8, 29);

describe('panel-resumen.util', () => {
  it('normaliza etiquetas: sin tildes ni puntuación y con el menos unificado', () => {
    expect(normalizar('Ratio de efectividad tramo −30 a 0 días')).toBe('ratio de efectividad tramo -30 a 0 dias');
    expect(normalizar('Nro. operaciones (%)')).toBe('nro operaciones %');
  });

  it('lee números del motor y de texto formateado', () => {
    expect(numeroDe(-274224)).toBe(-274224);
    expect(numeroDe('−1,671,566')).toBe(-1671566);
    expect(numeroDe('23.32%')).toBe(23.32);
    expect(numeroDe('2,081 pbs')).toBe(2081);
    expect(numeroDe(0.2332, { columnDef: 'x', format: { type: 'percent' } })).toBeCloseTo(23.32);
    expect(numeroDe('—')).toBeNull();
  });

  it('halla la fila por su nombre en cualquiera de las tablas, e ignora las que aún no respondieron', () => {
    expect(hallarFila([TABLA_PENDIENTE, PRESUPUESTO, EVOLUCION], /^stock de cartera/)?.fila['c2']).toBe(3254743);
    expect(hallarFila([EVOLUCION], /^no existe/)).toBeNull();
  });

  it('Cartera: cierre vs hoy, y el pie con su variación y tono', () => {
    const r = resumenDominio('cartera', RESULTADOS, CORTE);
    expect(r.barras.map((b) => b.valor)).toEqual(['3,528,967', '3,254,743']);
    expect(r.barras[0].etiqueta).toMatch(/^Cierre ago/i);
    expect(r.pie[0]).toEqual(expect.objectContaining({ etiqueta: 'Saldo medio', valor: '1,775,379', detalle: '−1,671,566', tono: 'mal' }));
    expect(r.pie[1]).toEqual(expect.objectContaining({ etiqueta: 'TAPP stock', valor: '23.32%', detalle: '+23 pbs', tono: 'bien' }));
    expect(r.indicadores[0]).toEqual(expect.objectContaining({ etiqueta: 'Stock de cartera', detalle: '−274,224 vs cierre' }));
  });

  it('una fila que el motor no trae queda en "—", no se inventa', () => {
    const r = resumenDominio('cartera', RESULTADOS, CORTE);
    expect(r.pie[2]).toEqual(expect.objectContaining({ etiqueta: 'TAPP mes', valor: '—' }));
    expect(resumenDominio('seguros', {}, CORTE).destacado).toBeNull();
  });

  it('Clientes: nuevos sin cambio se leen "= cierre"; recurrentes que bajan, en alerta', () => {
    const r = resumenDominio('clientes', RESULTADOS, CORTE);
    expect(r.pie[0]).toEqual(expect.objectContaining({ valor: '2', detalle: '= cierre' }));
    expect(r.pie[1]).toEqual(expect.objectContaining({ valor: '6', detalle: '−14', tono: 'mal' }));
  });

  it('Colocación: avance de operaciones y monto con la marca de días hábiles del monitor', () => {
    const r = resumenDominio('colocacion', RESULTADOS, CORTE);
    expect(r.barras.map((b) => [b.etiqueta, b.valor, b.tono])).toEqual([
      ['Operaciones', '53.33%', 'revisar'],
      ['Monto', '6.51%', 'mal'],
    ]);
    expect(r.barras[0].marca).toBeCloseTo(96.15);
    expect(r.pie[0].valor).toBe('8 / 15');
  });

  it('Tasas: distancia a la TAPP mínima destacada y barras TAPP mínima vs mes', () => {
    const r = resumenDominio('tasas', RESULTADOS, CORTE);
    expect(r.destacado).toEqual({ valor: '−277 pbs', texto: 'distancia a la TAPP mínima' });
    expect(r.barras.map((b) => b.valor)).toEqual(['55.76%', '52.98%']);
    expect(r.pie.map((m) => m.valor)).toEqual(['5', '—', '0']);
  });

  it('Mora: efectividad por tramo desde Cartera, con tono por nivel', () => {
    const r = resumenDominio('mora', RESULTADOS, CORTE);
    expect(r.barras.map((b) => [b.etiqueta, b.valor, b.tono])).toEqual([
      ['−30 a 0 días', '95.94%', 'bien'],
      ['1 a 30 días', '0.00%', 'mal'],
    ]);
    expect(r.pie[0]).toEqual(expect.objectContaining({ valor: '5', detalle: '+4', tono: 'mal' }));
  });
});
