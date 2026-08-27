import { kpisDeFilaTotal, KPIS_SEGUROS_OPTATIVOS_VACIOS } from './seguros.model';

/**
 * Regresión de la incidencia 8 de `docs/09-incidencias/incidencias-mora.md`:
 * "no me estás colocando los kpis que tiene el legacy".
 *
 * Faltaban porque asumí que serían un bloque aparte, y no lo son: el legado los
 * calcula desde la PRIMERA FILA de la misma tabla (`kpiTotales ← dataSource[0]`).
 */
describe('kpisDeFilaTotal', () => {
  /** Claves reales de `seguro-com.component.ts`, con los valores del reporte de la incidencia. */
  const FILA_TOTAL = {
    TOpeOS: 30994,
    TSegOS: 22296,
    PorcPenOS: 0.7194,
    SegMR: 1200,
    SegMC: 900,
    SegAgro: 450,
    SegPC: 300,
    SegOnco: 150,
    SPCCOS: 75,
  };

  it('saca los tres KPIs de cabecera de la fila total', () => {
    const kpis = kpisDeFilaTotal([FILA_TOTAL, { TOpeOS: 1 }]);

    expect(kpis.totalOperaciones).toBe(30994);
    expect(kpis.totalSeguros).toBe(22296);
    expect(kpis.penetracionGlobal).toBe(0.7194);
  });

  it('arma las seis mini-tarjetas de "Rendimiento por Tipo" en el orden del legado', () => {
    const kpis = kpisDeFilaTotal([FILA_TOTAL]);

    expect(kpis.porTipo).toEqual([
      { etiqueta: 'Multiriesgo', valor: 1200 },
      { etiqueta: 'Vida Segura', valor: 900 },
      { etiqueta: 'Agropecuario', valor: 450 },
      { etiqueta: 'Prot. Cuota', valor: 300 },
      { etiqueta: 'Oncológico', valor: 150 },
      { etiqueta: 'Prot. Total', valor: 75 },
    ]);
  });

  it('sin filas devuelve los KPIs vacíos en vez de romper', () => {
    expect(kpisDeFilaTotal([])).toEqual(KPIS_SEGUROS_OPTATIVOS_VACIOS);
  });

  it('una clave ausente o no numérica cuenta como 0, no como NaN', () => {
    const kpis = kpisDeFilaTotal([{ TOpeOS: 'sin dato', TSegOS: null }]);

    expect(kpis.totalOperaciones).toBe(0);
    expect(kpis.totalSeguros).toBe(0);
    expect(kpis.porTipo.every((t) => t.valor === 0)).toBe(true);
  });

  it('acepta los números como texto, que es como suele llegar el payload', () => {
    const kpis = kpisDeFilaTotal([{ TOpeOS: '30994', PorcPenOS: '0.7194' }]);

    expect(kpis.totalOperaciones).toBe(30994);
    expect(kpis.penetracionGlobal).toBe(0.7194);
  });

  /**
   * El propio legado duda de la unidad ("asumo que viene como '76.95%' o
   * número") y su `| percent` solo funciona con la fracción. Se aceptan las dos.
   */
  describe('penetración global', () => {
    it('deja la fracción tal cual: es lo que espera el `| percent` de la vista', () => {
      expect(kpisDeFilaTotal([{ PorcPenOS: 0.7194 }]).penetracionGlobal).toBe(0.7194);
    });

    it('un valor con "%" viene en puntos porcentuales y se pasa a fracción', () => {
      expect(kpisDeFilaTotal([{ PorcPenOS: '71.94%' }]).penetracionGlobal).toBeCloseTo(0.7194);
    });

    it('un valor ilegible cuenta como 0, no como NaN', () => {
      expect(kpisDeFilaTotal([{ PorcPenOS: 'sin dato' }]).penetracionGlobal).toBe(0);
    });
  });
});
