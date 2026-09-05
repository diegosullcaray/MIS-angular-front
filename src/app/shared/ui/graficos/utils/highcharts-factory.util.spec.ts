import type { PlotPieOptions, SeriesOptionsType, YAxisOptions } from 'highcharts';
import { opcionesMixto, opcionesPie } from './highcharts-factory.util';
import type { BloqueGrafico } from '../models/grafico-comun.model';

function bloque(series: BloqueGrafico['series']): BloqueGrafico {
  return { titulo: 'Prueba', categorias: ['Ene', 'Feb'], series };
}

/** Highcharts acepta `series` como objeto único o array; acá siempre es array. */
function seriesDe(opciones: ReturnType<typeof opcionesMixto>): SeriesOptionsType[] {
  return opciones.series as SeriesOptionsType[];
}

function ejeSecundario(opciones: ReturnType<typeof opcionesMixto>): YAxisOptions {
  return (opciones.yAxis as YAxisOptions[])[1];
}

describe('opcionesMixto: eje secundario', () => {
  it('por defecto solo las series con "%" en el nombre van al eje secundario', () => {
    const opciones = opcionesMixto(bloque([
      { nombre: 'Saldo', datos: [1, 2] },
      { nombre: 'Avance %', datos: [0.5, 0.6] },
    ]), false, { tipo: 'columna' });

    const [saldo, avance] = seriesDe(opciones);
    expect(saldo).toMatchObject({ type: 'column', yAxis: 0 });
    expect(avance).toMatchObject({ type: 'spline', yAxis: 1 });
    expect(ejeSecundario(opciones).visible).toBe(true);
  });

  /**
   * Tarea 2 de `incidencias-carteras-actualizado.md`: los evolutivos de
   * "Gestión Comercial" que mezclan un NIVEL con su VARIACIÓN. El legado pinta
   * el nivel como línea en su propio eje; con un solo eje la variación —que es
   * órdenes de magnitud menor— queda aplastada contra el cero.
   */
  it('`secundaria` manda al eje secundario una serie que NO es de porcentaje', () => {
    const opciones = opcionesMixto(bloque([
      { nombre: 'Saldo Vigente', datos: [2_400_000_000, 2_410_000_000], secundaria: true },
      { nombre: 'Var. Saldo Vigente', datos: [10_000, -5_000] },
    ]), false, { tipo: 'columna' });

    const [saldo, variacion] = seriesDe(opciones);
    expect(saldo).toMatchObject({ type: 'spline', yAxis: 1 });
    expect(variacion).toMatchObject({ type: 'column', yAxis: 0 });
  });

  it('ese eje NO se rotula en "%" cuando lo que va ahí no es un porcentaje', () => {
    const opciones = opcionesMixto(bloque([
      { nombre: 'Saldo Vigente', datos: [1], secundaria: true },
      { nombre: 'Var. Saldo Vigente', datos: [2] },
    ]), false, { tipo: 'columna' });

    expect(ejeSecundario(opciones).labels).not.toHaveProperty('format');
    expect(ejeSecundario(opciones).labels).toHaveProperty('formatter');
  });

  it('`secundaria: false` gana sobre el "%" del nombre', () => {
    const opciones = opcionesMixto(bloque([
      { nombre: 'Avance %', datos: [1], secundaria: false },
      { nombre: 'Saldo', datos: [2] },
    ]), false, { tipo: 'columna' });

    expect(seriesDe(opciones)[0]).toMatchObject({ type: 'column', yAxis: 0 });
    expect(ejeSecundario(opciones).visible).toBe(false);
  });

  it('sin nada en el eje secundario, ese eje queda oculto', () => {
    const opciones = opcionesMixto(bloque([{ nombre: 'Saldo', datos: [1] }]), false, { tipo: 'columna' });

    expect(ejeSecundario(opciones).visible).toBe(false);
  });

  /** En modo `linea` todas las series comparten el eje de valores. */
  it('el modo `linea` ignora `secundaria`: no hay eje secundario', () => {
    const opciones = opcionesMixto(bloque([
      { nombre: 'Saldo', datos: [1], secundaria: true },
      { nombre: 'Avance %', datos: [2] },
    ]), false, { tipo: 'linea' });

    expect(seriesDe(opciones).every((s) => (s as { yAxis?: number }).yAxis === 0)).toBe(true);
    expect(ejeSecundario(opciones).visible).toBe(false);
  });
});

/**
 * Incidencia reportada en Proyecciones: "Estado de Renovación (Base
 * Inicial)" es una DONA en el legado (`innerSize: '65%'`), no una torta llena.
 */
describe('opcionesPie: dona', () => {
  const PORCIONES = [
    { nombre: 'Renovados', valor: 45, color: '#4CB848' },
    { nombre: 'Por Renovar', valor: 35, color: '#004481' },
  ];

  function pie(opciones: ReturnType<typeof opcionesPie>): PlotPieOptions {
    return opciones.plotOptions!.pie as PlotPieOptions;
  }

  it('por defecto es torta llena: sin `innerSize`', () => {
    expect(pie(opcionesPie(PORCIONES, false))).not.toHaveProperty('innerSize');
  });

  it('`dona: true` la vacía por el centro', () => {
    expect(pie(opcionesPie(PORCIONES, false, { dona: true })).innerSize).toBe('65%');
  });

  it('respeta el color de cada porción', () => {
    const serie = (opcionesPie(PORCIONES, false, { dona: true }).series as SeriesOptionsType[])[0];
    expect((serie as { data: { name: string; y: number; color: string }[] }).data).toEqual([
      { name: 'Renovados', y: 45, color: '#4CB848' },
      { name: 'Por Renovar', y: 35, color: '#004481' },
    ]);
  });
});
