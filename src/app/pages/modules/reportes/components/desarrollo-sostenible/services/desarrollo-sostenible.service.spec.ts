import { corregirSemaforosDesempenoSocial } from './desarrollo-sostenible.service';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

/** Forma real de `DESEMP_SOC_01` (confirmada con datos en vivo): el semáforo que el backend pega junto a una columna en realidad colorea la SIGUIENTE. */
function tablaDesempenoSocial(): TablaReporteResultado {
  return {
    headers: [
      {
        columns: [
          { columnDef: 'DESVAL', header: 'Variable', isdata: 1 },
          { columnDef: '2021', header: '2025', cols: 3 },
          { columnDef: '2022', header: '2026', cols: 3 },
          { columnDef: 'col_7', header: 'META', cols: 1, isdata: 8, format: { type: 'number' } },
          { columnDef: 'col_8', isdata: 9, hidden: true, format: { type: 'traffic-light' } },
          { columnDef: 'col_9', header: 'TMM', cols: 2, isdata: 10, format: { type: 'number' } },
          { columnDef: 'col_10', isdata: 11, hidden: true, format: { type: 'traffic-light' } },
          { columnDef: 'col_11', header: 'TAM', cols: 2, isdata: 12, format: { type: 'number' } },
          { columnDef: 'col_12', isdata: 13, hidden: true, format: { type: 'traffic-light' } },
          { columnDef: 'col_13', header: 'Distancia Meta', cols: 2, isdata: 14, format: { type: 'number' } },
        ],
      },
      {
        columns: [{ columnDef: 'col_1', header: '13-Aug', isdata: 2, format: { type: 'number' } }],
      },
    ],
    body: [{ DESVAL: 'Clientes Nuevos del Mes', col_7: 4023, col_8: '0', col_9: -97, col_10: '1', col_11: 1215, col_12: undefined }],
    additional: {},
  };
}

describe('corregirSemaforosDesempenoSocial()', () => {
  it('reordena los semáforos ocultos para que coloreen la columna que les sigue, no la que tienen delante', () => {
    const corregido = corregirSemaforosDesempenoSocial(tablaDesempenoSocial());
    const columnas = corregido.headers[0].columns;

    // META queda sin semáforo detrás (cols:1, y el siguiente elemento del arreglo es TMM, no un oculto)
    const iMeta = columnas.findIndex((c) => c.columnDef === 'col_7');
    expect(columnas[iMeta].cols).toBe(1);
    expect(columnas[iMeta + 1].columnDef).toBe('col_9'); // TMM, no col_8

    // el semáforo que estaba pegado a META (col_8) ahora sigue a TMM
    const iTmm = columnas.findIndex((c) => c.columnDef === 'col_9');
    expect(columnas[iTmm].cols).toBe(2);
    expect(columnas[iTmm + 1].columnDef).toBe('col_8');
    expect(columnas[iTmm + 1].hidden).toBe(true);

    // el semáforo que estaba pegado a TMM (col_10) ahora sigue a TAM
    const iTam = columnas.findIndex((c) => c.columnDef === 'col_11');
    expect(columnas[iTam].cols).toBe(2);
    expect(columnas[iTam + 1].columnDef).toBe('col_10');
  });

  it('no rompe filas de encabezado que no tienen esta forma (otros reportes)', () => {
    const otraTabla: TablaReporteResultado = {
      headers: [{ columns: [{ columnDef: 'nom', header: 'Nombre', isdata: 1 }] }],
      body: [],
      additional: {},
    };
    expect(corregirSemaforosDesempenoSocial(otraTabla)).toEqual(otraTabla);
  });

  it('no rompe una tabla sin encabezados', () => {
    const vacia: TablaReporteResultado = { headers: [], body: [], additional: {} };
    expect(corregirSemaforosDesempenoSocial(vacia)).toEqual(vacia);
  });
});
