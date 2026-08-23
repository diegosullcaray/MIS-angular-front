import { moverSemaforosTrasSuValor } from './semaforo-tras-valor.util';
import type { ColumnaReporte, TablaReporteResultado } from '../models/tabla-reporte.model';

const sem = (columnDef: string, isdata: number): ColumnaReporte => ({
  columnDef,
  isdata,
  cols: 1,
  hidden: true,
  format: { type: 'traffic-light' },
});
const val = (columnDef: string, header: string, isdata: number, cols = 2): ColumnaReporte => ({
  columnDef,
  header,
  isdata,
  cols,
  format: { type: 'number' },
});

/** Encabezado real de `GCMGCAP_01` (capturado del backend). */
function encabezadoReal(): TablaReporteResultado {
  return {
    headers: [
      {
        columns: [
          { columnDef: 'DESVAL', header: 'Variable', isdata: 1, cols: 1, format: { type: 'string' } },
          { columnDef: 'columnDef_2', header: '2025', cols: 3, format: { type: 'string' } },
          { columnDef: 'columnDef_3', header: '2026', cols: 3, format: { type: 'string' } },
          val('7', 'METAS', 8, 1),
          sem('8', 9),
          val('9', 'TMM', 10),
          sem('10', 11),
          val('11', 'TAM', 12),
          sem('14', 13),
          val('15', 'TFM', 14),
          sem('12', 15),
          val('13', 'Distancia Metas', 16),
        ],
      },
      // Los 6 sub-encabezados de los grupos 2025/2026 ocupan isdata 2..7.
      { columns: [2, 3, 4, 5, 6, 7].map((n) => ({ columnDef: String(n - 1), header: `h${n}`, isdata: n, cols: 1 })) },
    ],
    body: [],
    additional: {},
  };
}

describe('moverSemaforosTrasSuValor', () => {
  it('deja cada métrica antes de su propio semáforo', () => {
    const columnas = moverSemaforosTrasSuValor(encabezadoReal()).headers[0].columns;

    expect(columnas.map((c) => c.columnDef)).toEqual([
      'DESVAL',
      'columnDef_2',
      'columnDef_3',
      '7', // METAS — no tiene semáforo propio
      '9', // TMM  ← antes venía '8' (TMM_Sem)
      '8',
      '11', // TAM
      '10',
      '15', // TFM
      '14',
      '13', // Distancia Metas
      '12',
    ]);
  });

  it('intercambia el isdata del par, para que el cuerpo siga el mismo orden', () => {
    const porDef = new Map(
      moverSemaforosTrasSuValor(encabezadoReal()).headers[0].columns.map((c) => [c.columnDef, c.isdata]),
    );

    expect(porDef.get('9')).toBe(9); // TMM toma el slot que ocupaba su semáforo
    expect(porDef.get('8')).toBe(10); // y el semáforo pasa al del valor
    expect(porDef.get('15')).toBe(13); // TFM
    expect(porDef.get('14')).toBe(14);
  });

  it('no toca el isdata de las columnas que no forman par', () => {
    const original = encabezadoReal();
    const corregido = moverSemaforosTrasSuValor(original);

    const isdataDe = (r: TablaReporteResultado, def: string) =>
      r.headers.flatMap((f) => f.columns).find((c) => c.columnDef === def)?.isdata;

    expect(isdataDe(corregido, 'DESVAL')).toBe(1);
    expect(isdataDe(corregido, '7')).toBe(8); // METAS
    // La segunda fila de encabezado (isdata 2..7) queda igual: sin eso, el
    // cuerpo se desalinea contra los grupos 2025/2026.
    expect(corregido.headers[1]).toEqual(original.headers[1]);
  });

  it('conserva el total de columnas con dato', () => {
    const conDato = (r: TablaReporteResultado) => r.headers.flatMap((f) => f.columns).filter((c) => c.isdata != null);
    const original = encabezadoReal();

    expect(conDato(moverSemaforosTrasSuValor(original)).length).toBe(conDato(original).length);
  });

  it('no altera un reporte sin semáforos', () => {
    const original: TablaReporteResultado = {
      headers: [{ columns: [val('a', 'A', 1, 1), val('b', 'B', 2, 1)] }],
      body: [],
      additional: {},
    };

    expect(moverSemaforosTrasSuValor(original)).toEqual(original);
  });

  it('ignora un semáforo que no va seguido de una métrica con dato', () => {
    const original: TablaReporteResultado = {
      headers: [{ columns: [val('a', 'A', 1, 1), sem('sem', 2)] }],
      body: [],
      additional: {},
    };

    expect(moverSemaforosTrasSuValor(original)).toEqual(original);
  });
});
