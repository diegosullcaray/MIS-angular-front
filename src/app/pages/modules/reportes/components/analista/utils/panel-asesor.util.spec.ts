import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';
import { GRUPOS_PANEL_ASESOR, REPORTES_ASESOR } from '../constantes/panel-asesor.constantes';
import { aNumero, bloquesDe, gruposOrdenados, kpisDeTotales, sinDatos } from './panel-asesor.util';

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

/** Tabla de dos niveles como la del motor: "Producto" | "Mes actual" › (Clientes, Saldo) | "Avance". */
const PRODUCTOS = tabla({
  headers: [
    {
      columns: [
        { columnDef: 'prod', header: 'Producto', isdata: 1, rows: 2 },
        { columnDef: 'g_mes', header: 'Mes actual', cols: 2 },
        { columnDef: 'avance', header: 'Avance', isdata: 4, rows: 2, format: { type: 'percent' } },
        { columnDef: 'sem', isdata: 5, hidden: true, format: { type: 'traffic-light' } },
      ],
    },
    {
      columns: [
        { columnDef: 'cli', header: 'Clientes', isdata: 2, format: { type: 'number' } },
        { columnDef: 'saldo', header: 'Saldo', isdata: 3, format: { type: 'number' } },
      ],
    },
  ],
  body: [
    { prod: 'Microempresa', cli: 124, saldo: 840000, avance: 0.814, sem: 1 },
    { prod: 'Agropecuario', cli: '42', saldo: 310000, avance: 0.5, sem: -1 },
    { prod: 'Total', cli: 166, saldo: 1150000, avance: 0.72, style: 1, style_avance: 0 },
  ],
});

describe('panel-asesor.util', () => {
  it('ordena grupos por tráfico total y cada reporte por su tráfico, sin perder ninguno', () => {
    const grupos = gruposOrdenados(GRUPOS_PANEL_ASESOR, REPORTES_ASESOR);
    expect(grupos.map((g) => g.grupo.id)).toEqual(['cartera', 'colocacion', 'recuperacion', 'gestion']);
    expect(grupos[0].reportes[0].codigo).toBe('L_CART_SEC');
    expect(grupos.flatMap((g) => g.reportes)).toHaveLength(17);
    for (const g of grupos) {
      const trafico = g.reportes.map((r) => r.peticiones);
      expect(trafico).toEqual([...trafico].sort((a, b) => b - a));
    }
  });

  it('aNumero acepta números y texto estrictamente numérico, nada más', () => {
    expect(aNumero(12.5)).toBe(12.5);
    expect(aNumero(' 42 ')).toBe(42);
    expect(aNumero('S/ 1,000')).toBeNull();
    expect(aNumero('81.4%')).toBeNull();
    expect(aNumero(Number.NaN)).toBeNull();
    expect(aNumero(null)).toBeNull();
  });

  it('kpisDeTotales toma la fila de totales con el formato de la tabla y su semáforo', () => {
    const kpis = kpisDeTotales(PRODUCTOS);
    expect(kpis.map((k) => k.etiqueta)).toEqual(['Mes actual · Clientes', 'Mes actual · Saldo', 'Avance']);
    expect(kpis[1].valor).toBe(new Intl.NumberFormat('es-PE').format(1150000));
    expect(kpis[2].valor).toContain('72');
    expect(kpis[2].semaforo).toBe(0);
    expect(kpis[0].semaforo).toBeNull();
  });

  it('kpisDeTotales no inventa un total cuando hay varias filas sin fila de totales', () => {
    const sinTotal = tabla({ ...PRODUCTOS, body: PRODUCTOS.body.slice(0, 2) });
    expect(kpisDeTotales(sinTotal)).toEqual([]);
    expect(kpisDeTotales(tabla({ ...PRODUCTOS, body: [PRODUCTOS.body[0]] }))).toHaveLength(3);
    expect(kpisDeTotales(undefined)).toEqual([]);
  });

  it('sinDatos distingue vacío real de tablas, gráficos o KPI con contenido', () => {
    expect(sinDatos({ tabla1: tabla(), tabla2: tabla() })).toBe(true);
    expect(sinDatos({ tabla1: tabla({ body: [{ a: 1 }] }) })).toBe(false);
    expect(sinDatos({ graficos: [{ titulo: '', categorias: ['a'], series: [{ nombre: 's', datos: [null] }] }] })).toBe(true);
    expect(sinDatos({ graficos: [{ titulo: '', categorias: ['a'], series: [{ nombre: 's', datos: [3] }] }] })).toBe(false);
    expect(sinDatos({ tabla1: tabla(), kpiMonto: { cumpl_ope_acum: '80%' } })).toBe(false);
  });

  it('bloquesDe respeta orden y títulos del legado y omite tablas que no llegaron', () => {
    const planilla = REPORTES_ASESOR.find((r) => r.codigo === 'L_PLAN_SEC')!;
    const bloques = bloquesDe(planilla, { tabla1: tabla(), tabla2: tabla(), tabla3: tabla(), tabla4: tabla() });
    expect(bloques.map((b) => b.tabla)).toEqual(['tabla2', 'tabla1', 'tabla3', 'tabla4']);
    expect(bloques[2].nota?.length).toBe(6);
    const cartera = REPORTES_ASESOR.find((r) => r.codigo === 'L_CART_SEC')!;
    expect(bloquesDe(cartera, { tabla1: tabla(), tabla2: tabla() }).map((b) => b.tabla)).toEqual(['tabla1', 'tabla2']);
  });
});
