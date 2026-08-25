/** Contrato de render de `<app-tabla-dinamica>`: columnas anidables con formato y semáforo. */

/** Columna dinámica del motor `table.regular` (`resultado.headers`, JSON string en el backend). */
export interface ColumnaDinamica {
  key: string;
  label: string;
  /** Estilo del ENCABEZADO (`<th>`): color de grupo y anchos. */
  style?: Record<string, string>;
  /** Estilo de las celdas del CUERPO (`<td>`): alineación y anchos — `cellStyle` del legado. */
  cellStyle?: Record<string, string>;
  /** Formato de la celda — lo declaran tanto el payload como los `tblHeaders` estáticos del legado (`{ type: 'integer' }`). */
  format?: { type?: string };
  /** Clave de la fila que trae el semáforo (-1/0/1) de esta columna — mismo punto y colores que `app-tabla-reporte` (`pi-circle-fill`). */
  semaforoKey?: string;
  subs?: ColumnaDinamica[];
}
