import type { ColumnaDinamica } from '../models/tabla-dinamica.model';

/** Nodo de encabezado con el colspan/rowspan ya calculados para `<th>`. */
export interface ColumnaEncabezadoCalculada extends ColumnaDinamica {
  colspan: number | null;
  rowspan: number | null;
}

export interface EncabezadosAplanados {
  /** Una entrada por nivel de encabezado (fila de `<th>`); columnas sin `subs` solo aparecen en el nivel 0. */
  filas: ColumnaEncabezadoCalculada[][];
  /** Columnas hoja en orden — mapean 1:1 con las celdas de cada fila del cuerpo (`fila[columna.key]`). */
  columnasHoja: ColumnaDinamica[];
}

function contarHojas(columna: ColumnaDinamica): number {
  if (!columna.subs || columna.subs.length === 0) return 1;
  return columna.subs.reduce((total, sub) => total + contarHojas(sub), 0);
}

function recolectarHojas(columnas: ColumnaDinamica[]): ColumnaDinamica[] {
  return columnas.flatMap((columna) => (columna.subs && columna.subs.length > 0 ? recolectarHojas(columna.subs) : [columna]));
}

function ubicarPorNivel(columnas: ColumnaDinamica[], nivel: number, filas: ColumnaEncabezadoCalculada[][]): void {
  if (!filas[nivel]) filas[nivel] = [];
  columnas.forEach((columna) => {
    const colspan = contarHojas(columna);
    filas[nivel].push({ ...columna, colspan: colspan > 1 ? colspan : null, rowspan: null });
    if (columna.subs && columna.subs.length > 0) {
      ubicarPorNivel(columna.subs, nivel + 1, filas);
    }
  });
}

/** Aplana un árbol de columnas (`subs` anidados, formato del `stg-table2` legado) en filas de encabezado con colspan/rowspan — puerto puro de `headerDefs()/evalHn()/fixSpans()/rowDefs()` de `stg-table2.component.ts`. */
export function aplanarEncabezados(columnas: ColumnaDinamica[]): EncabezadosAplanados {
  const filas: ColumnaEncabezadoCalculada[][] = [];
  ubicarPorNivel(columnas, 0, filas);

  const totalNiveles = filas.length;
  filas.forEach((fila, nivel) => {
    fila.forEach((columna) => {
      const esHoja = !columna.subs || columna.subs.length === 0;
      if (esHoja && totalNiveles - nivel > 1) {
        columna.rowspan = totalNiveles - nivel;
      }
    });
  });

  return { filas, columnasHoja: recolectarHojas(columnas) };
}
