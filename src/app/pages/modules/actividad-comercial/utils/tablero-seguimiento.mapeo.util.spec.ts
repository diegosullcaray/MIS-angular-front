import { mapearTablero, type FilaTablero } from './tablero-seguimiento.mapeo.util';

/** Fila del reporte `TAB_SEG_01` de una unidad, con cierre anterior y seguros cargados. */
const FILA: FilaTablero = {
  fec_corte: '2026-10-14',
  tip_cod: 18,
  cod_rel: '45',
  ind_seg_pendiente: 0,
  dias_hab_por: 0.6,
  car_sal_vig: 2441057,
  car_sal_vig_pro: 2115583,
  car_sal_vig_her: 325474,
  car_sal_vig_tra: 1139160,
  car_sal_vig_ant: 3528967,
  car_met_sal_vig: 4100000,
  car_ope: 124,
  car_ope_pro: 108,
  car_ope_her: 16,
  car_ope_tra: 46,
  car_ope_ant: 146,
  car_sal_med_vig: 19686,
  car_sal_med_vig_var: -4485,
  car_tas_stk_vig: 0.2332,
  car_tas_stk_vig_var_pbs: 23.4,
  car_cre_net: -0.078,
  car_var_net: -274224,
  des_pro: 1.74,
  des_met_pro: 2,
  des_mon: 95620,
  des_tic: 11953,
  des_tas: 0.4863,
  des_tas_min: 0.5576,
  rec_sal_pro: 240000,
  rec_sal_efe: 184650,
  rec_por_sal: 0.7694,
  rec_ope_pro: 40,
  rec_ope_efe: 28,
  rec_por_ope: 0.7,
  rec_efe_uno: 0.9594,
  rec_met_efe_uno: 0.95,
  rec_efe_dos: 0.625,
  rec_met_efe_dos: 75,
  rec_cli_mor: 5,
  rec_cli_mor_var: 4,
  rec_sal_mor: 166696,
  rec_sal_mor_var: 23698,
  rec_ope_ing_mor: 7,
  rec_sal_ing_mor: 48320,
  cli_car: 143,
  cli_car_ant: 142,
  cli_ing: 2,
  cli_sal: 1,
  cli_her: 1,
  cli_tra: 1,
  cli_cre_net: 1,
  cli_met_var: 18,
  cli_nue: 2,
  cli_nue_var: 0,
  cli_ban: 13,
  cli_ban_var: 4,
  cli_ret: 0.993,
  cli_ret_var_pp: -0.7,
  dig_enr: 68,
  dig_por_enr: 0.4755,
  dig_por_enr_var_pp: 3.19,
  dig_trx: 13,
  dig_usa_enr: 0.1912,
  dig_usa_enr_var_pp: 1.66,
  dig_met_usa_enr: 0.205,
  dig_cum_usa_enr: 0.933,
  dig_sem_usa_enr: 0,
  dig_usa_car: 0.0909,
  dig_usa_car_var_pp: 1.34,
  dig_met_usa_car: 0.09,
  dig_cum_usa_car: 1.01,
  dig_sem_usa_car: 1,
  dig_enr_nue: 5,
  dig_enr_nue_var: 1,
  dig_trx_mon: 9,
  dig_trx_mon_var: 1,
  dig_pag_dig: 6,
  dig_pag_dig_var: -1,
  seg_plz: 42,
  seg_met_plz: 50,
  seg_plz_mul: 16,
  seg_plz_pcu: 10,
  seg_plz_vid: 8,
  seg_plz_onc: 4,
  seg_plz_agr: 3,
  seg_plz_pto: 1,
  seg_pen: 0.875,
  seg_ase_sin_vta: 3,
};

describe('mapearTablero', () => {
  it('encabezado: entidad, periodo y corte desde fec_corte', () => {
    const t = mapearTablero(FILA, 'Unidad Norte');

    expect(t.entidad).toBe('Unidad Norte');
    expect(t.periodo).toBe('Octubre 2026');
    expect(t.corte).toBe('14/10/2026');
  });

  it('cartera: propia, heredada y trasladada salen de sus columnas; la meta es la de stock', () => {
    const { saldo, operaciones, kpis } = mapearTablero(FILA, 'x').cartera;

    expect(saldo.hoy.map((s) => [s.clave, s.valor])).toEqual([
      ['trasladada', 1139160],
      ['propia', 2115583],
      ['heredada', 325474],
    ]);
    expect(saldo.totalHoy).toBe(2441057);
    expect(saldo.cierreAnterior).toBe(3528967);
    expect(saldo.meta).toBe(4100000);
    expect(operaciones.totalHoy).toBe(124);
    expect(operaciones.meta).toBeUndefined();
    expect(kpis.map((k) => k.etiqueta)).toEqual(['Saldo medio', 'TAPP stock', 'Crecimiento neto']);
    expect(kpis[1]).toMatchObject({ valor: 23.32, delta: '+23 pbs', tono: 'positivo' });
    expect(kpis[2]).toMatchObject({ valor: -7.8, apoyo: '−274,224' });
  });

  it('desembolsos: en una unidad es productividad (operaciones por asesor) y el monto va sin meta', () => {
    const d = mapearTablero(FILA, 'x').desembolsos;

    expect(d.operaciones).toMatchObject({ etiqueta: 'Productividad', valor: 1.74, meta: 2, formato: 'decimal', etiquetaValor: '1.7 ops/ases.' });
    expect(d.monto).toBe(95620);
    expect(d.avanceEsperado).toBe(60);
    expect(d.etiquetaAvanceEsperado).toBe('Días hábiles (60%)');
    expect(d.kpis.map((k) => k.valor)).toEqual([11953, 48.63, 55.76]);
  });

  it('desembolsos: en un asesor la productividad son operaciones', () => {
    const d = mapearTablero({ ...FILA, tip_cod: 1, des_pro: 8 }, 'x').desembolsos;

    expect(d.operaciones).toMatchObject({ etiqueta: 'Operaciones', valor: 8, formato: 'entero', etiquetaValor: '8 ops' });
  });

  it('mora: porcentajes del SP, efectividad con meta en fracción o en porcentaje, mora que sube en rojo', () => {
    const m = mapearTablero(FILA, 'x').mora;

    expect(m.recuperaciones[0]).toMatchObject({ recuperado: 184650, total: 240000, porcentaje: 76.94 });
    expect(m.efectividades[0]).toMatchObject({ valor: 95.94, meta: 95 });
    expect(m.efectividades[1]).toMatchObject({ valor: 62.5, meta: 75 });
    expect(m.kpis[0]).toMatchObject({ valor: 5, delta: '+4', tono: 'negativo' });
    expect(m.kpis[2]).toMatchObject({ valor: 7, formato: 'operaciones', apoyo: '48,320' });
  });

  it('clientes: heredados restan, ingresos suman y el neto viene del SP', () => {
    const c = mapearTablero(FILA, 'x').clientes;

    expect(c.movimientos).toEqual([
      { etiqueta: 'Ingresos', valor: 2 },
      { etiqueta: 'Salidas', valor: -1 },
      { etiqueta: 'Heredados', valor: -1 },
      { etiqueta: 'Trasladados', valor: 1 },
    ]);
    expect(c.crecimientoNeto).toBe(1);
    expect(c.metaVariacion).toBe(18);
    expect(c.kpis[2]).toMatchObject({ valor: 99.3, delta: '−0.70 pp', tono: 'negativo' });
  });

  it('digital: anillos con su meta y semáforo solo en las usabilidades', () => {
    const { anillos, kpis } = mapearTablero(FILA, 'x').digital;

    expect(anillos[0]).toMatchObject({ titulo: 'Enrolamiento', fraccion: 0.4755, numerador: 68, denominador: 143, variacionPp: 3.19 });
    expect(anillos[0].meta).toBeUndefined();
    expect(anillos[1]).toMatchObject({ meta: 0.205, semaforo: 0, numerador: 13, denominador: 68 });
    expect(anillos[2]).toMatchObject({ meta: 0.09, semaforo: 1, denominador: 143 });
    expect(kpis.map((k) => k.delta)).toEqual(['+1', '+1', '−1']);
  });

  it('seguros: sin ingresos ni ticket prima (diferidos); la penetración sale del SP', () => {
    const s = mapearTablero(FILA, 'x').seguros;

    expect(s?.polizas).toMatchObject({ valor: 42, meta: 50 });
    expect(s?.tipos.reduce((suma, t) => suma + t.polizas, 0)).toBe(42);
    expect(s?.kpis.map((k) => k.etiqueta)).toEqual(['Penetración Opt.', 'Sin Venta Opt.']);
    expect(s?.kpis[0].valor).toBe(87.5);
  });

  it('seguros pendiente: el bloque es nulo, no cero', () => {
    expect(mapearTablero({ ...FILA, ind_seg_pendiente: true }, 'x').seguros).toBeNull();
    expect(mapearTablero({ ...FILA, ind_seg_pendiente: '1' }, 'x').seguros).toBeNull();
  });

  it('sin cierre anterior los comparativos quedan vacíos, no en 0', () => {
    const t = mapearTablero(
      {
        ...FILA,
        car_sal_vig_ant: null,
        car_met_sal_vig: null,
        car_sal_med_vig_var: null,
        car_tas_stk_vig_var_pbs: null,
        car_cre_net: null,
        car_var_net: null,
        cli_car_ant: null,
        cli_cre_net: null,
        cli_met_var: null,
        cli_ret: null,
        cli_ret_var_pp: null,
        dig_por_enr_var_pp: null,
        rec_efe_uno: null,
        rec_met_efe_uno: null,
        rec_por_sal: null,
      },
      'x',
    );

    expect(t.cartera.saldo.cierreAnterior).toBeNull();
    expect(t.cartera.saldo.meta).toBeUndefined();
    expect(t.cartera.kpis[0].delta).toBeUndefined();
    expect(t.cartera.kpis[1].delta).toBeUndefined();
    expect(t.cartera.kpis[2]).toMatchObject({ valor: null });
    expect(t.clientes.cierreAnterior).toBeNull();
    expect(t.clientes.crecimientoNeto).toBeNull();
    expect(t.clientes.metaVariacion).toBeNull();
    expect(t.clientes.kpis[2].valor).toBeNull();
    expect(t.digital.anillos[0].variacionPp).toBeNull();
    expect(t.mora.efectividades[0]).toMatchObject({ valor: null, meta: null });
    expect(t.mora.recuperaciones[0].porcentaje).toBeNull();
  });

  it('valores numéricos que llegan como texto se leen igual', () => {
    const t = mapearTablero({ ...FILA, car_sal_vig: '2441057.000000', cli_car: '143' }, 'x');

    expect(t.cartera.saldo.totalHoy).toBe(2441057);
    expect(t.clientes.hoy).toBe(143);
  });
});
