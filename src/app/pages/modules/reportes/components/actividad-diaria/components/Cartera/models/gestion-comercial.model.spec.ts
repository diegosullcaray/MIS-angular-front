import { claseCumplimiento, kpisDeFilaTotal, KPIS_GESTION_COMERCIAL_VACIOS } from './gestion-comercial.model';

/**
 * Regresión de la tarea 2 de `incidencias-carteras-actualizado.md`:
 * "actualmente no se están mapeando los KPIs en la vista".
 *
 * Igual que en Seguros Optativos, no son un bloque aparte: el legado los saca de
 * la PRIMERA FILA de `RS_GEST_COM_01` (`setKpiValues(r.data)` ← `data[0]`).
 */
describe('kpisDeFilaTotal (Gestión Comercial)', () => {
  /** Claves reales de `setKpiValues()`, con los valores del reporte de la incidencia. */
  const FILA_TOTAL = {
    prod_ind: 13.88,
    TMMPROD: 0.76,
    Percent_Cumpl: 0.96,
    percent_avance_hoy: 0.809,
    hvalvar_8070: 17.2,

    tick_prom_2: 12_110,
    TMM_TICK: -247.91,
    percent_avance_ticket: 0.9657,
    hvalvar_134: 12_540,

    mont_dese_2: 244_050_000,
    TMMDESEMB: 5_790_000,
    percentcumpldesembolsometadi: 0.9538,
    percent_avance_montode: 0.7824,
    hvalvar_133: 311_930_000,

    HVSALVIGMN: -17_890_000,
    HRODAM: 17_339_000,
    hvalvar_136: 260_500_000,

    sal_vig_2: 2_432_304_000,
    hvalvar_10256: -2_760_000,
    distdiariacartvig: -15_120_000,

    TMMRODAMIENTO: -615_500,
    HSALNOVIG: 17_583_100,
    TMMHSALNOVIG: -635_600,
    HSALVIGEN: 244_000,
    TMMSALVIGE: -20_000,

    cli_stock_2: 210_712,
    TMMCLISTOCK: 861,
    percent_avance_cli_stock: 0.2008,
    hvalvar_10062: 4_290,

    HNUMCLIN: 5_820,
    TMMCLINUEV: 358,
    Percent_Cumpl_clinuevo: 0.89,
    percent_avance_cli_nuevos: 0.7523,
    hvalvar_166: 7_740,
  };

  it('mapea los diez bloques de tarjetas desde la fila total, ignorando el resto', () => {
    const k = kpisDeFilaTotal([FILA_TOTAL, { prod_ind: 99 }]);

    expect(k.productividad).toBe(13.88);
    expect(k.ticket).toBe(12_110);
    expect(k.desembolsos).toBe(244_050_000);
    expect(k.carteraVigente).toBe(2_432_304_000);
    expect(k.rodamiento).toBe(17_339_000);
    expect(k.saldoNoVigente).toBe(17_583_100);
    expect(k.saldoVigente).toBe(244_000);
    expect(k.clientesStock).toBe(210_712);
    expect(k.clientesNuevos).toBe(5_820);
  });

  it('las métricas secundarias (TMM y metas) viajan con su tarjeta', () => {
    const k = kpisDeFilaTotal([FILA_TOTAL]);

    expect(k.tmmProductividad).toBe(0.76);
    expect(k.tmmTicket).toBe(-247.91);
    expect(k.tmmDesembolsos).toBe(5_790_000);
    expect(k.tmmRodamiento).toBe(-615_500);
    expect(k.tmmSaldoNoVigente).toBe(-635_600);
    expect(k.tmmSaldoVigente).toBe(-20_000);
    expect(k.varClientesStock).toBe(861);
    expect(k.tmmClientesNuevos).toBe(358);
    expect(k.metaProductividad).toBe(17.2);
    expect(k.metaTicket).toBe(12_540);
    expect(k.metaDesembolsos).toBe(311_930_000);
    expect(k.metaVarClientesStock).toBe(4_290);
    expect(k.metaClientesNuevos).toBe(7_740);
  });

  it('los cumplimientos y avances llegan en fracción y se guardan en %', () => {
    const k = kpisDeFilaTotal([FILA_TOTAL]);

    expect(k.cumplProductividad).toBeCloseTo(96);
    expect(k.avanceProductividad).toBeCloseTo(80.9);
    expect(k.cumplDesembolsos).toBeCloseTo(95.38);
    expect(k.avanceDesembolsos).toBeCloseTo(78.24);
    expect(k.cumplClientesNuevos).toBeCloseTo(89);
    expect(k.avanceClientesNuevos).toBeCloseTo(75.23);
  });

  /** El legado no pide "Cancelación Vig." al backend: la despeja de otras tres métricas. */
  it('la cancelación vigente sale de desembolsos − var. saldo vigente − rodamiento', () => {
    const k = kpisDeFilaTotal([FILA_TOTAL]);

    expect(k.cancelacionVigente).toBe(244_050_000 - -17_890_000 - 17_339_000);
    expect(k.avanceCancelacion).toBeCloseTo((k.cancelacionVigente / 260_500_000) * 100);
  });

  it('sin meta de cancelación el avance queda en 0, no en Infinity', () => {
    const k = kpisDeFilaTotal([{ mont_dese_2: 100, hvalvar_136: 0 }]);

    expect(k.avanceCancelacion).toBe(0);
  });

  it('sin filas devuelve todos los KPIs en cero', () => {
    expect(kpisDeFilaTotal([])).toEqual(KPIS_GESTION_COMERCIAL_VACIOS);
  });

  it('una clave ausente o no numérica cuenta como 0, no como NaN', () => {
    const k = kpisDeFilaTotal([{ prod_ind: 'sin dato', sal_vig_2: null }]);

    expect(k.productividad).toBe(0);
    expect(k.carteraVigente).toBe(0);
    expect(Object.values(k).some(Number.isNaN)).toBe(false);
  });
});

/**
 * Semáforo de cumplimiento. El legado (`obtenerClaseColor`) vuelve a multiplicar
 * por 100 adentro, así que los cumplimientos que ya venían en % siempre le
 * salían verdes; acá el helper recibe SIEMPRE el porcentaje.
 */
describe('claseCumplimiento', () => {
  it.each([
    [120, 'success'],
    [100, 'success'],
    [99.9, 'orange'],
    [80, 'orange'],
    [79.9, 'danger'],
    [0, 'danger'],
  ])('%s%% cae en el tramo %s', (porcentaje, tramo) => {
    expect(claseCumplimiento(porcentaje)).toContain(tramo);
  });

  it('un cumplimiento del 96 % NO se pinta verde: está por debajo de la meta', () => {
    expect(claseCumplimiento(96)).not.toEqual(claseCumplimiento(100));
  });
});
