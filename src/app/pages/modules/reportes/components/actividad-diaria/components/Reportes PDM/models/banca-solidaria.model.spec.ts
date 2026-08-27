import { derivadosDeFilaTotal, KPIS_BANCA_SOLIDARIA_VACIOS } from './banca-solidaria.model';

/**
 * Regresión de la tarea 3 de `incidencias-proeyecciones.md`: "faltan las
 * tarjetas de indicadores (KPIs) y las gráficas del dashboard legacy".
 *
 * Igual que en Gestión Comercial y Seguros Optativos, no son bloques aparte: el
 * legado los saca de la PRIMERA FILA de `GRBSOLI_01` (`setKpiValues(r.data)`,
 * que además dispara `updateDonutChart(row0)` y `updateBarChart(row0)`).
 */
describe('derivadosDeFilaTotal (Banca Solidaria)', () => {
  /** Claves reales de `banca-solidaria.component.ts`. */
  const FILA_TOTAL = {
    sal_vig_bs: 4_021_011,
    mod_desem_bs: 1_884_900,
    tick_prom_bs: 1_312.6,
    cont_cli_gr_bs: 5_380,
    tapp_mes_bs: 1,

    Porcentaje_Renovados: 45,
    Porcentaje_PorRenovar: 35,
    Porcentaje_Vencidos: 15,
    Porcentaje_VencenHoy: 5,

    conteo_ant_cli_nuev: 1_200,
    conteo_ant_cli_recurr: 3_400,
    conteo_ant_cli_repre: 780,
  };

  it('mapea las cinco tarjetas desde la fila total, ignorando el resto', () => {
    const { kpis } = derivadosDeFilaTotal([FILA_TOTAL, { sal_vig_bs: 99 }]);

    expect(kpis).toEqual({
      saldoVigente: 4_021_011,
      montoDesembolsado: 1_884_900,
      ticketPromedio: 1_312.6,
      numeroClientes: 5_380,
      // Llega como fracción; la vista la pinta como `tasaMes * 100`.
      tasaMes: 1,
    });
  });

  it('la dona lleva los cuatro estados en el orden y con los colores del legado', () => {
    const { estadoRenovacion } = derivadosDeFilaTotal([FILA_TOTAL]);

    expect(estadoRenovacion).toEqual([
      { nombre: 'Renovados', valor: 45, color: '#4CB848' },
      { nombre: 'Por Renovar', valor: 35, color: '#004481' },
      { nombre: 'Vencidos', valor: 15, color: '#EF4444' },
      { nombre: 'Vencen Hoy', valor: 5, color: '#F59E0B' },
    ]);
  });

  it('la barra lleva las tres antigüedades en el orden de `xAxis.categories`', () => {
    const { antiguedadCliente } = derivadosDeFilaTotal([FILA_TOTAL]);

    expect(antiguedadCliente.categorias).toEqual(['Nuevos', 'Recurrentes', 'Recuperados']);
    expect(antiguedadCliente.series).toEqual([
      { nombre: 'Clientes', datos: [1_200, 3_400, 780], color: '#004481' },
    ]);
  });

  it('sin filas los KPIs quedan en cero y las gráficas conservan su estructura', () => {
    const { kpis, estadoRenovacion, antiguedadCliente } = derivadosDeFilaTotal([]);

    expect(kpis).toEqual(KPIS_BANCA_SOLIDARIA_VACIOS);
    // La dona y la barra siguen existiendo, con todo en cero: así el gráfico se
    // dibuja vacío en vez de romper la pantalla.
    expect(estadoRenovacion.map((p) => p.valor)).toEqual([0, 0, 0, 0]);
    expect(antiguedadCliente.series[0].datos).toEqual([0, 0, 0]);
  });

  it('una clave ausente o no numérica cuenta como 0, no como NaN', () => {
    const { kpis, antiguedadCliente } = derivadosDeFilaTotal([{ sal_vig_bs: 'sin dato', cont_cli_gr_bs: null }]);

    expect(kpis.saldoVigente).toBe(0);
    expect(kpis.numeroClientes).toBe(0);
    expect(antiguedadCliente.series[0].datos.every((d) => d === 0)).toBe(true);
  });
});
