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
  /** Función para computar estilo dinámico de celda (color, background, font-weight) según el valor y fila — legado cellStyleFn. */
  cellStyleFn?: (valor: unknown, fila: Record<string, unknown>) => Record<string, string> | undefined;
  /**
   * Variación con flecha — `indicator: 'arrow'` + `colorValue` del legado (`dynamic-format-pipe.ts`):
   * ▲/▼ según el signo, el valor en absoluto y ambos en el color que devuelve la función. La tabla no
   * decide si subir es bueno: esa polaridad es del reporte. `null` deja la celda sin indicador.
   */
  colorVariacion?: (valor: number, fila: Record<string, unknown>) => string | null;
  subs?: ColumnaDinamica[];
}
