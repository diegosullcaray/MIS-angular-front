import type {
  AnilloDigital,
  CarteraAsesor,
  ClientesAsesor,
  DesembolsosAsesor,
  DigitalAsesor,
  KpiTablero,
  MoraAsesor,
  SegurosAsesor,
  SemaforoDigital,
  TableroAsesor,
  TonoDelta,
} from '../models/actividad-comercial.model';
import { formatearDelta, formatearEntero, formatearVariacion } from './actividad-comercial.util';

/** Una fila del reporte `TAB_SEG_01` (SP `RTABSEG01`): una entidad, columnas en `snake_case`. */
export type FilaTablero = Record<string, unknown>;

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/** Nivel de asesor: ahí `des_pro` son operaciones; arriba, operaciones por asesor. */
const NIVEL_ASESOR = 1;

/** Número de una columna; `null` si falta o no es numérica (NULL del SP = sin dato, no 0). */
function num(f: FilaTablero, clave: string): number | null {
  const v = f[clave];
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Columnas que el SP nunca deja en NULL (conteos y saldos de las tablas): un faltante es 0. */
function cero(f: FilaTablero, clave: string): number {
  return num(f, clave) ?? 0;
}

/** Fracción del SP (0,1912) como porcentaje (19,12). */
function pct(f: FilaTablero, clave: string): number | null {
  const v = num(f, clave);
  return v === null ? null : v * 100;
}

function verdadero(v: unknown): boolean {
  return v === true || v === 1 || v === '1' || v === 'true';
}

function tono(v: number | null, sobeEsBueno: boolean): TonoDelta | undefined {
  if (v === null || v === 0) return undefined;
  return v > 0 === sobeEsBueno ? 'positivo' : 'negativo';
}

/** KPI con variación entera (`+4`) leída de la columna `_var`. */
function kpi(f: FilaTablero, etiqueta: string, claveValor: string, formato: KpiTablero['formato'], claveVar: string | null, sobeEsBueno = true): KpiTablero {
  const variacion = claveVar === null ? null : num(f, claveVar);
  return {
    etiqueta,
    valor: num(f, claveValor),
    formato,
    ...(variacion === null ? {} : { delta: formatearDelta(variacion), tono: tono(variacion, sobeEsBueno) }),
  };
}

/** `2026-10-14` (o con hora) → partes de la fecha de corte. */
function partesFecha(valor: unknown): { anio: number; mes: number; dia: number } {
  const [anio = 0, mes = 1, dia = 1] = String(valor ?? '').slice(0, 10).split('-').map(Number);
  return { anio, mes, dia };
}

function desembolsos(f: FilaTablero): DesembolsosAsesor {
  const esAsesor = cero(f, 'tip_cod') === NIVEL_ASESOR;
  const productividad = cero(f, 'des_pro');
  const avanceDias = cero(f, 'dias_hab_por') * 100;
  return {
    operaciones: {
      etiqueta: esAsesor ? 'Operaciones' : 'Productividad',
      valor: productividad,
      meta: num(f, 'des_met_pro'),
      formato: esAsesor ? 'entero' : 'decimal',
      etiquetaValor: esAsesor ? `${formatearEntero(productividad)} ops` : `${productividad.toFixed(1)} ops/ases.`,
    },
    monto: cero(f, 'des_mon'),
    avanceEsperado: avanceDias,
    etiquetaAvanceEsperado: `Días hábiles (${Math.round(avanceDias)}%)`,
    kpis: [
      { etiqueta: 'Ticket Promedio', valor: num(f, 'des_tic'), formato: 'entero' },
      { etiqueta: 'TAPP Mes', valor: pct(f, 'des_tas'), formato: 'porcentaje' },
      { etiqueta: 'TAPP Mínima', valor: pct(f, 'des_tas_min'), formato: 'porcentaje' },
    ],
  };
}

/**
 * La meta de efectividad llega "en la escala de la fuente" (V02, sin confirmar): fracción o porcentaje.
 * shortcut: se asume fracción si es ≤ 1, porcentaje si no; confirmar la escala con el dueño de VDMCOM01 126/122.
 */
function metaEfectividad(f: FilaTablero, clave: string): number | null {
  const v = num(f, clave);
  if (v === null) return null;
  return v <= 1 ? v * 100 : v;
}

function mora(f: FilaTablero): MoraAsesor {
  const ingresosMonto = num(f, 'rec_sal_ing_mor');
  return {
    recuperaciones: [
      {
        titulo: 'Monto recuperado',
        recuperado: cero(f, 'rec_sal_efe'),
        total: cero(f, 'rec_sal_pro'),
        porcentaje: pct(f, 'rec_por_sal'),
      },
      {
        titulo: 'Operaciones recuperadas',
        recuperado: cero(f, 'rec_ope_efe'),
        total: cero(f, 'rec_ope_pro'),
        porcentaje: pct(f, 'rec_por_ope'),
      },
    ],
    efectividades: [
      { etiqueta: 'Efectividad −30 a 0 días', valor: pct(f, 'rec_efe_uno'), meta: metaEfectividad(f, 'rec_met_efe_uno') },
      { etiqueta: 'Efectividad 1 a 30 días', valor: pct(f, 'rec_efe_dos'), meta: metaEfectividad(f, 'rec_met_efe_dos') },
    ],
    kpis: [
      kpi(f, 'Clientes en mora', 'rec_cli_mor', 'entero', 'rec_cli_mor_var', false),
      kpi(f, 'Saldo en mora', 'rec_sal_mor', 'entero', 'rec_sal_mor_var', false),
      {
        etiqueta: 'Ingresos a mora',
        valor: num(f, 'rec_ope_ing_mor'),
        formato: 'operaciones',
        ...(ingresosMonto === null ? {} : { apoyo: formatearEntero(ingresosMonto) }),
      },
    ],
  };
}

function cartera(f: FilaTablero): CarteraAsesor {
  const metaSaldo = num(f, 'car_met_sal_vig');
  const tasaVar = num(f, 'car_tas_stk_vig_var_pbs');
  const crecimiento = num(f, 'car_var_net');
  return {
    saldo: {
      titulo: 'Saldo vigente',
      formato: 'entero',
      paleta: 'saldo',
      hoy: [
        { clave: 'trasladada', etiqueta: 'Trasladada', valor: cero(f, 'car_sal_vig_tra') },
        { clave: 'propia', etiqueta: 'Propia', valor: cero(f, 'car_sal_vig_pro') },
        { clave: 'heredada', etiqueta: 'Heredada', valor: cero(f, 'car_sal_vig_her') },
      ],
      totalHoy: cero(f, 'car_sal_vig'),
      cierreAnterior: num(f, 'car_sal_vig_ant'),
      ...(metaSaldo === null ? {} : { meta: metaSaldo }),
    },
    operaciones: {
      titulo: 'Operaciones',
      formato: 'entero',
      paleta: 'operaciones',
      hoy: [
        { clave: 'trasladada', etiqueta: 'Trasladada', valor: cero(f, 'car_ope_tra') },
        { clave: 'propia', etiqueta: 'Propia', valor: cero(f, 'car_ope_pro') },
        { clave: 'heredada', etiqueta: 'Heredada', valor: cero(f, 'car_ope_her') },
      ],
      totalHoy: cero(f, 'car_ope'),
      cierreAnterior: num(f, 'car_ope_ant'),
    },
    // Saldo medio y TAPP stock en su versión vigente, la misma del saldo del gráfico (V09 pendiente).
    kpis: [
      kpi(f, 'Saldo medio', 'car_sal_med_vig', 'entero', 'car_sal_med_vig_var'),
      {
        etiqueta: 'TAPP stock',
        valor: pct(f, 'car_tas_stk_vig'),
        formato: 'porcentaje',
        ...(tasaVar === null ? {} : { delta: `${tasaVar > 0 ? '+' : tasaVar < 0 ? '−' : ''}${Math.abs(Math.round(tasaVar))} pbs`, tono: tono(tasaVar, true) }),
      },
      {
        etiqueta: 'Crecimiento neto',
        valor: pct(f, 'car_cre_net'),
        formato: 'porcentaje',
        ...(crecimiento === null ? {} : { apoyo: formatearDelta(crecimiento) }),
      },
    ],
  };
}

function clientes(f: FilaTablero): ClientesAsesor {
  const retVar = num(f, 'cli_ret_var_pp');
  return {
    hoy: cero(f, 'cli_car'),
    cierreAnterior: num(f, 'cli_car_ant'),
    // Los conteos del SP son positivos; el signo de heredados y salidas es de presentación (V09).
    movimientos: [
      { etiqueta: 'Ingresos', valor: cero(f, 'cli_ing') },
      { etiqueta: 'Salidas', valor: -cero(f, 'cli_sal') },
      { etiqueta: 'Heredados', valor: -cero(f, 'cli_her') },
      { etiqueta: 'Trasladados', valor: cero(f, 'cli_tra') },
    ],
    crecimientoNeto: num(f, 'cli_cre_net'),
    metaVariacion: num(f, 'cli_met_var'),
    kpis: [
      kpi(f, 'Nuevos', 'cli_nue', 'entero', 'cli_nue_var'),
      kpi(f, 'Bancarizados', 'cli_ban', 'entero', 'cli_ban_var'),
      {
        etiqueta: 'Retención',
        valor: pct(f, 'cli_ret'),
        formato: 'porcentaje',
        ...(retVar === null ? {} : { delta: formatearVariacion(retVar, 'pp'), tono: tono(retVar, true) }),
      },
    ],
  };
}

function anillo(
  f: FilaTablero,
  titulo: string,
  fraccion: string,
  numerador: string,
  denominador: string,
  variacionPp: string,
  descripcion: string,
  meta?: { valor: string; cumplimiento: string; semaforo: string },
): AnilloDigital {
  const base = {
    titulo,
    fraccion: cero(f, fraccion),
    numerador: cero(f, numerador),
    denominador: cero(f, denominador),
    variacionPp: num(f, variacionPp),
    descripcion,
  };
  const metaValor = meta ? num(f, meta.valor) : null;
  if (!meta || metaValor === null) return base;
  return {
    ...base,
    meta: metaValor,
    cumplimiento: cero(f, meta.cumplimiento),
    semaforo: cero(f, meta.semaforo) as SemaforoDigital,
  };
}

function digital(f: FilaTablero): DigitalAsesor {
  return {
    anillos: [
      anillo(f, 'Enrolamiento', 'dig_por_enr', 'dig_enr', 'cli_car', 'dig_por_enr_var_pp', 'Clientes enrolados en la app sobre los clientes de cartera.'),
      anillo(f, 'Usab. enrolados', 'dig_usa_enr', 'dig_trx', 'dig_enr', 'dig_usa_enr_var_pp', 'Enrolados que transaccionan en el mes.', {
        valor: 'dig_met_usa_enr',
        cumplimiento: 'dig_cum_usa_enr',
        semaforo: 'dig_sem_usa_enr',
      }),
      anillo(f, 'Usab. cartera', 'dig_usa_car', 'dig_trx', 'cli_car', 'dig_usa_car_var_pp', 'Clientes de cartera que transaccionan en el mes.', {
        valor: 'dig_met_usa_car',
        cumplimiento: 'dig_cum_usa_car',
        semaforo: 'dig_sem_usa_car',
      }),
    ],
    kpis: [
      kpi(f, 'Nuevos enrolados', 'dig_enr_nue', 'entero', 'dig_enr_nue_var'),
      kpi(f, 'Trx. monetarias', 'dig_trx_mon', 'entero', 'dig_trx_mon_var'),
      kpi(f, 'Pago digital', 'dig_pag_dig', 'entero', 'dig_pag_dig_var'),
    ],
  };
}

/** Seguros: nulo mientras la carga de seguros no corrió. Ingresos y ticket prima están diferidos y no vienen del SP. */
function seguros(f: FilaTablero): SegurosAsesor | null {
  if (verdadero(f['ind_seg_pendiente'])) return null;
  const sinVenta = num(f, 'seg_ase_sin_vta');
  return {
    polizas: { etiqueta: 'Pólizas Totales', valor: cero(f, 'seg_plz'), meta: num(f, 'seg_met_plz'), formato: 'entero' },
    tipos: [
      { nombre: 'Multiriesgo', polizas: cero(f, 'seg_plz_mul'), color: 'var(--mis-primary)' },
      { nombre: 'Prot. Cuota', polizas: cero(f, 'seg_plz_pcu'), color: 'var(--mis-success)' },
      { nombre: 'Vida Segura', polizas: cero(f, 'seg_plz_vid'), color: 'var(--mis-warning)' },
      { nombre: 'Oncológico', polizas: cero(f, 'seg_plz_onc'), color: 'var(--mis-brand-magenta)' },
      { nombre: 'Agropecuario', polizas: cero(f, 'seg_plz_agr'), color: 'var(--mis-brand-sky)' },
      { nombre: 'Prot. Total', polizas: cero(f, 'seg_plz_pto'), color: 'var(--mis-danger)' },
    ],
    kpis: [
      { etiqueta: 'Penetración Opt.', valor: pct(f, 'seg_pen'), formato: 'porcentaje' },
      { etiqueta: 'Sin Venta Opt.', valor: sinVenta, formato: 'asesores', alerta: (sinVenta ?? 0) > 0 },
    ],
  };
}

/** Fila del reporte → modelo de vista del tablero. `entidad` es la descripción del nodo elegido en la jerarquía. */
export function mapearTablero(f: FilaTablero, entidad: string): TableroAsesor {
  const { anio, mes, dia } = partesFecha(f['fec_corte']);
  const dd = String(dia).padStart(2, '0');
  const mm = String(mes).padStart(2, '0');
  return {
    entidad,
    periodo: `${MESES[mes - 1] ?? ''} ${anio}`.trim(),
    corte: `${dd}/${mm}/${anio}`,
    desembolsos: desembolsos(f),
    mora: mora(f),
    seguros: seguros(f),
    cartera: cartera(f),
    clientes: clientes(f),
    digital: digital(f),
  };
}
