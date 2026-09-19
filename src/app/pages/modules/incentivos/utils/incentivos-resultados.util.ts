import { aNumeroIncentivo, asignarValores, marcarHabilitados, marcarVisibles, sumarPorIds, resolverSituacion } from './incentivos-calculo.util';
import { crearAvancesDefault, crearCalculadoraDefault, crearPerfilSemDefault, crearSuperPlusDefault, resolverConfiguracionUsuario } from './incentivos-config.util';
import { CLAVES_INCENTIVOS } from '../constantes/incentivos.constantes';
import type { NivelSeleccionado } from '../models/incentivos-perfil.model';
import type { ResultadosBody } from '../models/incentivos-api-response.model';
import type { FilaTablaVariable, FilaTablaEfectividad, ItemSemaforo, ItemAvance, ItemSuperPlus, MonetizadoIncentivo } from '../models/incentivos-tablas.model';
import type { CalculadoraConfig } from '../models/incentivos-calculadora.model';

export interface ResultadosIncentivosVista {
  tablaVariables: FilaTablaVariable[];
  tablaEfectividad: FilaTablaEfectividad[];
  semaforo: ItemSemaforo[];
  avances: ItemAvance[];
  superPlus: ItemSuperPlus[];
  monetizado: Pick<MonetizadoIncentivo, 'bonoBase' | 'bonoPlus' | 'bonoSuperPlus' | 'bonoTotal' | 'codigoSituacion' | 'descripcionSituacion' | 'puedeSimular'>;
  calculadora: CalculadoraConfig;
}

/** Traduce resultados de campaña sin acceso a transporte ni estado. */
export function mapearResultadosIncentivos(
    ds: NonNullable<ResultadosBody['resultado']>,
    cfg: ReturnType<typeof resolverConfiguracionUsuario>,
    nivel: NivelSeleccionado,
    puedeSimular: boolean
): ResultadosIncentivosVista {
    const ds3 = ds.ds3 ?? {};
    const ds4 = ds.ds4 ?? {};

    const tablaVariables = ds.ds1 ?? [];
    const tablaEfectividad = ds.ds2 ?? [];

    let sem = marcarVisibles(crearPerfilSemDefault(), cfg.prof);
    sem = asignarValores(sem, ds4, 'val', CLAVES_INCENTIVOS.flag, '', aNumeroIncentivo);

    const flagAct = Number(ds4[CLAVES_INCENTIVOS.flagActivo] ?? 0);
    const situacion = resolverSituacion(flagAct);

    let avances = marcarVisibles(crearAvancesDefault(), cfg.avanS);
    avances = marcarHabilitados(avances, cfg.avanE);
    avances = asignarValores(avances, ds3, 'val', '', CLAVES_INCENTIVOS.sufijoAvance, aNumeroIncentivo);
    avances = asignarValores(avances, ds3, 'per', '', CLAVES_INCENTIVOS.sufijoAvancePorcentaje, aNumeroIncentivo);

    let superPlus = marcarVisibles(crearSuperPlusDefault(), cfg.supS);
    superPlus = marcarHabilitados(superPlus, cfg.supE);
    superPlus = asignarValores(superPlus, ds4, 'val', CLAVES_INCENTIVOS.bonoSuperPlus, '', aNumeroIncentivo);

    const bonoBase = sumarPorIds(ds4, cfg.prof, CLAVES_INCENTIVOS.bonoBase, '');
    const bonoPlus = sumarPorIds(ds4, cfg.prof, CLAVES_INCENTIVOS.bonoPlus, '');
    const bonoSuperPlus = sumarPorIds(ds4, cfg.calS, CLAVES_INCENTIVOS.bonoSuperPlus, '');
    const bonoTotal = bonoBase + bonoPlus + bonoSuperPlus;

    const monetizado = {
      bonoBase,
      bonoPlus,
      bonoSuperPlus,
      bonoTotal,
      codigoSituacion: situacion.codigo,
      descripcionSituacion: situacion.descripcion,
      puedeSimular,
    };

    let vars = marcarVisibles(crearCalculadoraDefault().variables, cfg.prof);
    vars = asignarValores(vars, ds3, 'val', '', CLAVES_INCENTIVOS.sufijoReal, aNumeroIncentivo);
    vars = asignarValores(vars, ds3, 'met', '', CLAVES_INCENTIVOS.sufijoMeta, aNumeroIncentivo);
    vars = asignarValores(vars, ds4, 'bob', CLAVES_INCENTIVOS.bonoBase, '', aNumeroIncentivo);
    vars = asignarValores(vars, ds4, 'bop', CLAVES_INCENTIVOS.bonoPlus, '', aNumeroIncentivo);

    let plus = marcarVisibles(crearCalculadoraDefault().plus, cfg.supS);
    plus = marcarHabilitados(plus, cfg.calE);
    plus = asignarValores(plus, ds3, 'val', '', CLAVES_INCENTIVOS.sufijoReal, aNumeroIncentivo);
    plus = asignarValores(plus, ds4, 'bos', CLAVES_INCENTIVOS.bonoSuperPlus, '', aNumeroIncentivo);

    if (nivel.claUsu === 1) {
      const idxEfec1 = vars.findIndex((v) => v.id === 'efec1' && v.show);
      if (idxEfec1 !== -1) {
        vars[idxEfec1] = {
          ...vars[idxEfec1],
          tp1: Number(ds3['pag1'] ?? 0),
          tp2: Number(ds3['pag2'] ?? 0),
          tp3: Number(ds3['pag3'] ?? 0),
        };
      }
      const idxTas = plus.findIndex((p) => p.id === 'tas' && p.show);
      if (idxTas !== -1) {
        plus[idxTas] = { ...plus[idxTas], val1: Number(ds3['tas_min'] ?? 0), met: Number(ds3['tas_met'] ?? 0) };
      }
    }

    const calculadora: CalculadoraConfig = {
      variables: vars,
      plus,
      bonoBase,
      bonoPlus,
      bonoSuperPlus,
      bonoTotal,
      activo: situacion.codigo,
      margenRenovacion: Number(ds3['mar_ren'] ?? 0),
      claseUsuario: nivel.claUsu,
    };
    return { tablaVariables, tablaEfectividad, semaforo: sem, avances, superPlus, monetizado, calculadora };
  }

