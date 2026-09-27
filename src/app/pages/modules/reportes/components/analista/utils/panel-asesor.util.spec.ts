import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';
import { GRUPOS_PANEL_ASESOR, REPORTES_ASESOR } from '../constantes/panel-asesor.constantes';
import { aNumero, bloquesDe, gruposOrdenados, sinDatos } from './panel-asesor.util';

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

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

  it('bloquesDe nombra toda tabla: su título, o el del reporte numerado si hay varias sin nombre', () => {
    const cartera = REPORTES_ASESOR.find((r) => r.codigo === 'L_CART_SEC')!;
    expect(bloquesDe(cartera, { tabla1: tabla(), tabla2: tabla() }).map((b) => b.titulo)).toEqual(['Cartera · 1 de 2', 'Cartera · 2 de 2']);
    expect(bloquesDe(cartera, { tabla1: tabla() }).map((b) => b.titulo)).toEqual(['Cartera']);
    const captaciones = REPORTES_ASESOR.find((r) => r.codigo === 'L_CAPT_SEC')!;
    const titulos = bloquesDe(captaciones, { tabla1: tabla(), tabla2: tabla(), tabla3: tabla() }).map((b) => b.titulo);
    expect(titulos).toEqual(['Captaciones · 1 de 2', 'Captaciones · 2 de 2', 'Ahorro Programado']);
  });
});
