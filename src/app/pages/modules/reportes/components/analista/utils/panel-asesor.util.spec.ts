import { TABLA_PENDIENTE, type TablaReporteResultado } from '../../../models/tabla-reporte.model';
import { CODIGO_CLIENTES_CONSOLIDADO, GRUPOS_PANEL_ASESOR, REPORTES_ASESOR } from '../constantes/panel-asesor.constantes';
import { aNumero, bloquesDe, gruposOrdenados, sinDatos } from './panel-asesor.util';

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('panel-asesor.util', () => {
  it('ordena grupos por tráfico total y cada reporte por su tráfico, sin perder ninguno', () => {
    const grupos = gruposOrdenados(GRUPOS_PANEL_ASESOR, REPORTES_ASESOR);
    // "Movilidad y gestión" se dio de baja: quedan tres pestañas.
    expect(grupos.map((g) => g.grupo.id)).toEqual(['cartera', 'colocacion', 'recuperacion']);
    expect(grupos[0].reportes.map((r) => r.codigo)).toEqual(['L_CART_SEC', CODIGO_CLIENTES_CONSOLIDADO]);
    expect(grupos[1].reportes.map((r) => r.codigo)).toEqual(['L_MONI_DESE_SEC', 'L_SEG_SEC', 'L_REP_AUTO_SEC']);
    expect(grupos[2].reportes.map((r) => r.codigo)).toEqual(['L_MON_EFE_DET_SEC', 'L_REC_PREVE_SEC']);
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

  it('sinDatos distingue vacío real de tablas, gráficos o KPI con contenido', () => {
    expect(sinDatos({ tabla1: tabla(), tabla2: tabla() })).toBe(true);
    expect(sinDatos({ tabla1: tabla({ body: [{ a: 1 }] }) })).toBe(false);
    expect(sinDatos({ graficos: [{ titulo: '', categorias: ['a'], series: [{ nombre: 's', datos: [null] }] }] })).toBe(true);
    expect(sinDatos({ graficos: [{ titulo: '', categorias: ['a'], series: [{ nombre: 's', datos: [3] }] }] })).toBe(false);
    expect(sinDatos({ tabla1: tabla(), kpiMonto: { cumpl_ope_acum: '80%' } })).toBe(false);
    // Una tabla que aún no respondió no cuenta como vacío.
    expect(sinDatos({ tabla1: tabla(), tabla2: TABLA_PENDIENTE })).toBe(false);
  });

  it('bloquesDe respeta orden y títulos del legado y omite tablas que no llegaron', () => {
    const clientes = REPORTES_ASESOR.find((r) => r.codigo === CODIGO_CLIENTES_CONSOLIDADO)!;
    const cinco = { tabla1: tabla(), tabla2: tabla(), tabla3: tabla(), tabla4: tabla(), tabla5: tabla() };
    expect(bloquesDe(clientes, cinco).map((b) => b.titulo)).toEqual([
      'Grupos PDM',
      'Clientes Nuevos y Recurrentes',
      'Clientes Producto · 1 de 3',
      'Clientes Producto · 2 de 3',
      'Clientes Producto · 3 de 3',
    ]);
    const cartera = REPORTES_ASESOR.find((r) => r.codigo === 'L_CART_SEC')!;
    expect(bloquesDe(cartera, { tabla1: tabla(), tabla2: tabla() }).map((b) => b.tabla)).toEqual(['tabla1', 'tabla2']);
  });

  it('bloquesDe nombra toda tabla: su título, o el del reporte numerado si hay varias sin nombre', () => {
    const cartera = REPORTES_ASESOR.find((r) => r.codigo === 'L_CART_SEC')!;
    expect(bloquesDe(cartera, { tabla1: tabla(), tabla2: tabla() }).map((b) => b.titulo)).toEqual(['Cartera · 1 de 2', 'Cartera · 2 de 2']);
    expect(bloquesDe(cartera, { tabla1: tabla() }).map((b) => b.titulo)).toEqual(['Cartera']);
  });
});
