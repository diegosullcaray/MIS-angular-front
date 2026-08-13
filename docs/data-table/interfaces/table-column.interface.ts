/**
 * Tipo de dato de la columna
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tipo para filas de la tabla.
 * Se usa `any` intencionalmente porque la tabla es genérica y acepta
 * cualquier interfaz de fila (Sistema, Role, UsuarioTableRow, etc.).
 * Los consumidores deben tipar sus propias rows al construir TableConfig.
 */
export type TableRow = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export enum ColumnType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  DROPDOWN = 'dropdown',
  CUSTOM = 'custom'
}

/**
 * Tipo de filtro para la columna
 */
export enum FilterType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DROPDOWN = 'dropdown',
  NONE = 'none'
}

/**
 * Configuración de una columna de la tabla
 */
export interface TableColumn {
  /** Campo del objeto de datos */
  field: string;
  /** Título de la columna */
  header: string;
  /** Tipo de dato */
  type: ColumnType;
  /** Tipo de filtro */
  filterType?: FilterType;
  /** Ancho de la columna (px o %) */
  width?: string;
  /** Ancho mínimo */
  minWidth?: string;
  /** Ancho máximo */
  maxWidth?: string;
  /** Si es ordenable */
  sortable?: boolean;
  /** Si es visible en móvil */
  mobileVisible?: boolean;
  /** Si solo se muestra en móvil */
  mobileOnly?: boolean;
  /** Alineación del texto */
  align?: 'left' | 'center' | 'right';
  /** Formato para números */
  numberFormat?: string;
  /** Locale para formateo de números (por defecto 'es-ES', usar 'en-US' para punto decimal) */
  numberLocale?: string;
  /** Formato para fechas */
  dateFormat?: string;
  /** Opciones para dropdown (si filterType es DROPDOWN) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dropdownOptions?: { label: string; value: any }[];
  /** Función para obtener el label de un valor (para dropdowns).
   *  El parámetro es `any` porque el tipo del valor depende de la columna. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLabel?: (value: any) => string;
  /** Si la columna es parte de las acciones */
  isAction?: boolean;
  /** Clase CSS personalizada */
  cssClass?: string;
  /** Si se muestra en el filtro global */
  globalFilter?: boolean;
  /** Si la columna es clickeable (en móvil, solo esta columna emitirá el evento rowClick) */
  clickable?: boolean;
  /** Función para renderizar HTML personalizado en la celda (usar con precaución, solo valores internos) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderHtml?: (value: any, row: TableRow) => string;
}

/**
 * Configuración de acciones de la tabla
 */
export interface TableAction {
  /** Ícono del botón */
  icon: string | ((row: TableRow) => string);
  /** Label del botón */
  label?: string | ((row: TableRow) => string);
  /** Clases CSS personalizadas para el botón */
  styleClass?: string | ((row: TableRow) => string);
  /** Severidad del botón (success, info, warning, danger) */
  severity?: 'success' | 'info' | 'warning' | 'danger' | 'secondary' | ((row: TableRow) => 'success' | 'info' | 'warning' | 'danger' | 'secondary');
  /** Tooltip */
  tooltip?: string | ((row: TableRow) => string);
  /** Si está deshabilitado */
  disabled?: (row: TableRow) => boolean;
  /** Función a ejecutar al hacer clic */
  action: (row: TableRow, index: number) => void;
  /** Si se muestra solo si hay permisos (puede ser boolean o función que retorna boolean) */
  permission?: boolean | ((row: TableRow) => boolean);
}

/**
 * Configuración de la tabla
 */
export interface TableConfig {
  /** Columnas de la tabla */
  columns: TableColumn[];
  /** Datos a mostrar */
  data: TableRow[];
  /** Clase CSS para el contenedor de la tabla (p-table.styleClass) */
  tableStyleClass?: string;
  /** Si muestra la búsqueda global */
  showGlobalSearch?: boolean;
  /** Placeholder de la búsqueda global */
  globalSearchPlaceholder?: string;
  /** Si muestra los filtros por columna */
  showColumnFilters?: boolean;
  /** Si muestra el botón de agregar */
  showAddButton?: boolean;
  /** Label del botón agregar */
  addButtonLabel?: string;
  /** Función al hacer clic en agregar */
  onAdd?: () => void;
  /** Si muestra el botón de exportar */
  showExportButton?: boolean;
  /** Label del botón exportar */
  exportButtonLabel?: string;
  /** Función para exportar */
  onExport?: (filteredData: TableRow[]) => void;
  /** Acciones por fila */
  rowActions?: TableAction[];
  /** Si permite selección múltiple */
  selection?: boolean;
  /** Campo único para identificar filas */
  dataKey?: string;
  /** Si está cargando */
  loading?: boolean;
  /** Mensaje cuando no hay datos */
  emptyMessage?: string;
  /** Filas por página */
  rowsPerPage?: number;
  /** Opciones de filas por página */
  rowsPerPageOptions?: number[];
  /** Habilita o deshabilita el paginador (por defecto habilitado) */
  paginator?: boolean;
  /** Habilita el scroll interno de la tabla (por defecto true) */
  scrollable?: boolean;
  /** Alto del área scrollable (ej. '400px' o '50vh'). Si no se provee, no se aplicará */
  scrollHeight?: string;
  /** Total de registros (para paginación server-side) */
  totalRecords?: number;
  /** Índice del primer registro actual (para paginación server-side) */
  first?: number;
  /** Habilita modo lazy (server-side) */
  lazy?: boolean;
  /** Campos para el filtro global */
  globalFilterFields?: string[];
  /** Controla cuándo se dispara la búsqueda global: 'type' = al escribir, 'enter' = solo al presionar Enter */
  globalSearchTrigger?: 'type' | 'enter';
  /** Si muestra el reporte de página actual */
  showCurrentPageReport?: boolean;
  /** Template del reporte de página */
  currentPageReportTemplate?: string;
  /** Función para renderizar el footer de la tabla */
  onFooter?: () => { cells?: TableRow[] } | TableRow[];
  /** Función opcional para determinar si una fila puede ser seleccionada */
  isRowSelectable?: (row: TableRow) => boolean;
  /** Función opcional para obtener clases CSS dinámicas por fila */
  getRowClass?: (row: TableRow) => string;
  /** Ancho personalizado para la columna de checkbox en escritorio (ej: '2.75rem') */
  checkboxColumnWidth?: string;
  /** Ancho personalizado para la columna de checkbox en móvil (ej: '2.75rem') */
  checkboxColumnWidthMobile?: string;
/** Configuración opcional para agrupar filas (rowspan) por el valor de una columna */
    rowGroup?: {
    /** Campo por el cual se agrupan filas consecutivas */
    field: string;
    /** Habilita/deshabilita el agrupamiento */
    enabled?: boolean;
  };

}

