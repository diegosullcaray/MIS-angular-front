import { corregirSemaforosDesplazados } from './semaforos-desplazados.util';
import type { ColumnaReporte, TablaReporteResultado } from '../models/tabla-reporte.model';

const semaforo = (columnDef: string, isdata: number): ColumnaReporte => ({
  columnDef,
  isdata,
  hidden: true,
  format: { type: 'traffic-light' },
});

const valor = (columnDef: string, header: string, isdata: number): ColumnaReporte => ({
  columnDef,
  header,
  isdata,
  format: { type: 'number' },
});

function resultado(columnas: ColumnaReporte[]): TablaReporteResultado {
  return { headers: [{ columns: columnas }], body: [], additional: {} };
}

describe('corregirSemaforosDesplazados', () => {
  it('mueve cada semáforo al valor que le sigue, y deja el primero sin punto', () => {
    // Forma de GCMGCAP_01 / DESEMP_SOC_01: el backend pega el semáforo al valor
    // ANTERIOR, pero colorea el SIGUIENTE. "METAS" nunca tiene punto propio.
    const corregido = corregirSemaforosDesplazados(
      resultado([
        { columnDef: 'variable', header: 'Variable', isdata: 1 },
        valor('metas', 'METAS', 2),
        semaforo('sem_metas', 3),
        valor('tmm', 'TMM', 4),
        semaforo('sem_tmm', 5),
        valor('tam', 'TAM', 6),
        semaforo('sem_tam', 7),
        valor('tfm', 'TFM', 8),
      ]),
    );

    const columnas = corregido.headers[0].columns;
    expect(columnas.map((c) => c.columnDef)).toEqual([
      'variable',
      'metas',
      'tmm',
      'sem_metas', // el punto de "METAS" es en realidad el de "TMM"
      'tam',
      'sem_tmm', // el de "TMM" es el de "TAM"
      'tfm',
      'sem_tam', // el de "TAM" es el de "TFM"
    ]);

    // "METAS" queda sin semáforo; cada métrica siguiente abarca su valor + punto.
    const porDef = new Map(columnas.map((c) => [c.columnDef, c]));
    expect(porDef.get('metas')?.cols).toBe(1);
    expect(porDef.get('tmm')?.cols).toBe(2);
    expect(porDef.get('tam')?.cols).toBe(2);
    expect(porDef.get('tfm')?.cols).toBe(2);
  });

  it('renumera isdata en el nuevo orden, para que el cuerpo se alinee', () => {
    const corregido = corregirSemaforosDesplazados(
      resultado([
        { columnDef: 'variable', header: 'Variable', isdata: 1 },
        valor('metas', 'METAS', 2),
        semaforo('sem_metas', 3),
        valor('tmm', 'TMM', 4),
      ]),
    );

    expect(corregido.headers[0].columns.map((c) => [c.columnDef, c.isdata])).toEqual([
      ['variable', 1],
      ['metas', 2],
      ['tmm', 3],
      ['sem_metas', 4],
    ]);
  });

  it('el total de columnas de datos no cambia — solo su orden', () => {
    const original = resultado([
      { columnDef: 'variable', header: 'Variable', isdata: 1 },
      valor('metas', 'METAS', 2),
      semaforo('sem_metas', 3),
      valor('tmm', 'TMM', 4),
      semaforo('sem_tmm', 5),
      valor('tam', 'TAM', 6),
    ]);
    const cuantasConDato = (r: TablaReporteResultado) => r.headers[0].columns.filter((c) => c.isdata != null).length;

    expect(cuantasConDato(corregirSemaforosDesplazados(original))).toBe(cuantasConDato(original));
  });

  it('no toca un reporte sin semáforos', () => {
    const original = resultado([valor('a', 'A', 1), valor('b', 'B', 2)]);
    expect(corregirSemaforosDesplazados(original)).toEqual(original);
  });

  it('no toca un reporte cuyos semáforos no siguen a un valor con dato', () => {
    const original = resultado([semaforo('sem', 1), valor('a', 'A', 2)]);
    expect(corregirSemaforosDesplazados(original)).toEqual(original);
  });

  it('conserva las filas de encabezado de nivel 2', () => {
    const original: TablaReporteResultado = {
      headers: [
        { columns: [valor('metas', 'METAS', 1), semaforo('sem_metas', 2), valor('tmm', 'TMM', 3)] },
        { columns: [{ columnDef: 'sub', header: 'Sub' }] },
      ],
      body: [],
      additional: {},
    };

    expect(corregirSemaforosDesplazados(original).headers[1]).toEqual(original.headers[1]);
  });
});
