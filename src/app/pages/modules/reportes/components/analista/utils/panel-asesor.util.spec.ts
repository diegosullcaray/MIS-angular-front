import { TABLA_PENDIENTE, type TablaReporteResultado } from '../../../models/tabla-reporte.model';
import { CODIGO_CLIENTES_CONSOLIDADO, DOMINIOS_PANEL, REPORTES_ASESOR } from '../constantes/panel-asesor.constantes';
import { bloquesDe, sinDatos } from './panel-asesor.util';

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('panel-asesor.util', () => {
  it('seis dominios en el orden de la maqueta, y todo reporte en el detalle de uno de ellos', () => {
    expect(DOMINIOS_PANEL.map((d) => d.id)).toEqual(['cartera', 'clientes', 'colocacion', 'tasas', 'seguros', 'mora']);
    const porDominio = (id: string) => REPORTES_ASESOR.filter((r) => r.dominio === id).map((r) => r.codigo);
    expect(porDominio('cartera')).toEqual(['L_CART_SEC']);
    expect(porDominio('clientes')).toEqual([CODIGO_CLIENTES_CONSOLIDADO]);
    expect(porDominio('colocacion')).toEqual(['L_MONI_DESE_SEC']);
    expect(porDominio('tasas')).toEqual(['L_REP_AUTO_SEC']);
    expect(porDominio('seguros')).toEqual(['L_SEG_SEC']);
    expect(porDominio('mora')).toEqual(['L_MON_EFE_DET_SEC', 'L_REC_PREVE_SEC']);
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
      'Clientes nuevos y recurrentes',
      'Clientes por producto · 1 de 3',
      'Clientes por producto · 2 de 3',
      'Clientes por producto · 3 de 3',
      'Grupos PDM',
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
