/** Tipo de filtro de columna en la fila de filtros (oculta por defecto, se activa con "Filtrar"). */
export type DataTableFilterType = 'text' | 'number' | 'dropdown' | 'date';

/** Definición de una columna de `DataTableComponent`. */
export interface DataTableColumn {
  /** Clave del dato en cada fila, o un id propio para columnas sin dato real (ej. una columna de acciones). */
  field: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  /** Ancho fijo de la columna (ej. `'7rem'`). */
  width?: string;
  /** Por defecto `true` — clic en el header ordena la tabla por esta columna. */
  sortable?: boolean;
  /** Sin valor, la columna no tiene filtro propio en la fila de filtros. */
  filterType?: DataTableFilterType;
  /** Opciones para `filterType: 'dropdown'`. */
  dropdownOptions?: { label: string; value: unknown }[];
  filterPlaceholder?: string;
  /** Por defecto `true` — en `sm:` (&lt;640px) se oculta la columna para priorizar las esenciales. */
  mobileVisible?: boolean;
}
