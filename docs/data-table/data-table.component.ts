import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, ViewChild, HostListener, ChangeDetectorRef, TemplateRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Table, TablePageEvent } from 'primeng/table';
import { FilterService, MenuItem } from 'primeng/api';
import { ContextMenu } from 'primeng/contextmenu';
import { Menu } from 'primeng/menu';
import { Subscription } from 'rxjs';
import { TableColumn, TableConfig, FilterType, ColumnType, TableAction, TableRow } from './interfaces/table-column.interface';
import { customDateFilter, formatDateForComparison } from '../../../core/helpers/date.helper';
import { TranslatableComponent } from '../translatable/translatable.component';

@Component({
  selector: 'shared-data-table',
  standalone: false,
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
  // changeDetection: ChangeDetectionStrategy.OnPush // Comentado para mejor rendimiento con filtros dinámicos
})
export class DataTableComponent extends TranslatableComponent implements OnInit, OnChanges, OnDestroy {
  @Input() config!: TableConfig;
  @Input() captionTemplate?: TemplateRef<{ emit: (payload: unknown) => void }>;
  @Input() selectedItems: TableRow[] = [];
  @Output() rowClick = new EventEmitter<TableRow>();
  @Output() selectionChange = new EventEmitter<TableRow[]>();
  @Output() filtersChange = new EventEmitter<{ field?: string; value?: unknown; global?: string; filters?: Record<string, unknown> }>();
  @Output() pageChange = new EventEmitter<{ page: number; rows: number; first: number }>();
  @Output() filterInput = new EventEmitter<any>();
  @Output() clearCaptions = new EventEmitter<void>();
  @Output() globalSearchEnter = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<{ field?: string; order?: number }>();

  @ViewChild('dt') table!: Table;
  @ViewChild('searchInput') searchInput?: HTMLInputElement;
  @ViewChild('cellContextMenu') cellContextMenu?: ContextMenu;

  // Estado de filtros
  filtrosVisibles: boolean = false;
  filtroGlobalValue: string = '';
  filtros: Record<string, unknown> = {};

  // Selección
  selectAll: boolean = false;

  // Estado móvil
  isMobile: boolean = false;
  expandedRows: Set<number> = new Set();

  // Cache para las celdas del footer
  footerCellsCache: TableRow[] = [];

  // Menú contextual de acciones por fila
  contextMenuItems: MenuItem[] = [];
  activeContextRow: number | null = null;
  activeMenuRef: Menu | null = null;
  preserveRowHighlightOnActionMenuHide: boolean = false;
  private menuItemsCache: WeakMap<TableRow, { signature: string[]; items: MenuItem[] }> = new WeakMap();

  // Referencias a tipos para usar en template
  FilterType = FilterType;
  ColumnType = ColumnType;

  // Suscripción a cambios de idioma
  private translationsSubscription?: Subscription;

  // Textos traducibles que se actualizan automáticamente
  translatedTexts = {
    currentPageReport: '',
    globalSearchPlaceholder: '',
    filtersButton: '',
    filtersButtonActive: '',
    filtersTooltip: '',
    clearButton: '',
    clearTooltip: '',
    filterPlaceholder: '',
    emptyMessage: '',
    emptyHint: ''
  };

  constructor(
    private filterService: FilterService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {
    super();
  }

  safeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
}

  ngOnInit(): void {
    this.registerCustomDateFilter();
    this.updateIsMobile();
    this.initializeFilters();
    this.setupSelection();
    this.updateFooterCells();
    this.updateTranslatedTexts();

    // Suscribirse a cambios de idioma para actualizar traducciones en tiempo real
    this.translationsSubscription = this.translationService.translations$.subscribe(() => {
      // Actualizar todos los textos traducibles
      this.updateTranslatedTexts();
      this.clearActionMenuCache();
      // Forzar detección completa de cambios para actualizar todas las traducciones del template
      this.cdr.detectChanges();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config) {
      this.updateFooterCells();
      this.clearActionMenuCache();
    }
  }

  ngOnDestroy(): void {
    // Limpiar suscripción al destruir el componente
    if (this.translationsSubscription) {
      this.translationsSubscription.unsubscribe();
    }

    this.closeCellContextMenu();
    this.activeMenuRef?.hide();
  }

  /**
   * Actualiza todos los textos traducibles
   */
  private updateTranslatedTexts(): void {
    const locale = this.translationService.currentLocale?.toLowerCase?.() || 'es';
    const defaultFilter = locale === 'en' ? 'Filter' : 'Filtrar';
    const defaultFilterActive = locale === 'en' ? 'Unfilter' : 'Desfiltrar';

    this.translatedTexts = {
      currentPageReport: this.t('content.layoutMain.Administration.dataTable.currentPageReport', 'Mostrando {first} a {last} de {totalRecords} registros'),
      globalSearchPlaceholder: this.t('content.layoutMain.Administration.dataTable.globalSearchPlaceholder', 'Buscar...'),
      filtersButton: this.t('content.layoutMain.Administration.dataTable.filtersButton', defaultFilter),
      filtersButtonActive: this.t('content.layoutMain.Administration.dataTable.filtersButtonActive', defaultFilterActive),
      filtersTooltip: this.t('content.layoutMain.Administration.dataTable.filtersTooltip', 'Mostrar/ocultar filtros por columna'),
      clearButton: this.t('content.layoutMain.Administration.dataTable.clearButton', 'Limpiar'),
      clearTooltip: this.t('content.layoutMain.Administration.dataTable.clearTooltip', 'Limpiar todos los filtros y búsquedas'),
      filterPlaceholder: this.t('content.layoutMain.Administration.dataTable.filterPlaceholder', 'Filtrar {column}'),
      emptyMessage: this.t('content.layoutMain.Administration.dataTable.emptyMessage', 'No se encontraron registros'),
      emptyHint: this.t('content.layoutMain.Administration.dataTable.emptyHint', 'Intenta ajustar los filtros de búsqueda')
    };
  }

  /**
   * Configura la selección inicial
   */
  private setupSelection(): void {
    if (this.config.selection && this.selectedItems.length > 0) {
      this.updateSelectAllState();
    }
  }

  /**
   * Maneja el cambio de selección
   */
  onSelectionChange(): void {
    this.updateSelectAllState();
    this.selectionChange.emit(this.selectedItems);
  }

  /**
   * Actualiza el estado de "seleccionar todo"
   */
  updateSelectAllState(): void {
    if (!this.config.selection || !this.table) {
      return;
    }
    const filteredData = this.table.filteredValue || this.config.data;
    if (!filteredData || filteredData.length === 0) {
      this.selectAll = false;
      return;
    }
    const dataKey = this.config.dataKey;
    let selectedCount = 0;

    if (dataKey) {
      // Filtrar items nulos y obtener las claves de los items seleccionados válidos
      const validSelectedItems = this.selectedItems.filter(item => item != null && item[dataKey] != null);
      const selectedKeys = new Set(validSelectedItems.map(item => item[dataKey]));
      // Contar solo los items válidos que están seleccionados
      selectedCount = filteredData.filter(item =>
        item != null && item[dataKey] != null && selectedKeys.has(item[dataKey])
      ).length;
    } else {
      // Sin dataKey, comparar por referencia directa
      selectedCount = filteredData.filter(item =>
        item != null && this.selectedItems.includes(item)
      ).length;
    }

    this.selectAll = selectedCount === filteredData.length;
  }

  /**
   * Maneja el toggle de "seleccionar todo"
   */
  toggleSelectAll(): void {
    if (!this.config.selection || !this.table) {
      return;
    }
    const filteredData = this.table.filteredValue || this.config.data;
    if (!filteredData || filteredData.length === 0) {
      return;
    }

    // Filtrar solo items válidos (no null)
    const validFilteredData = filteredData.filter(item => item != null);

    if (this.selectAll) {
      // Deseleccionar todas las visibles
      const dataKey = this.config.dataKey;
      if (dataKey) {
        const visibleKeys = new Set(validFilteredData.map(item => item[dataKey]).filter(key => key != null));
        this.selectedItems = this.selectedItems.filter(item =>
          item != null && item[dataKey] != null && !visibleKeys.has(item[dataKey])
        );
      } else {
        this.selectedItems = this.selectedItems.filter(item => item != null && !validFilteredData.includes(item));
      }
    } else {
      // Seleccionar todas las visibles
      const dataKey = this.config.dataKey;
      if (dataKey) {
        const validSelectedItems = this.selectedItems.filter(item => item != null && item[dataKey] != null);
        const selectedKeys = new Set(validSelectedItems.map(item => item[dataKey]));
        const newSelections = validFilteredData.filter(item =>
          item != null && item[dataKey] != null && !selectedKeys.has(item[dataKey])
        );
        this.selectedItems = [...this.selectedItems, ...newSelections];
      } else {
        const newSelections = validFilteredData.filter(item =>
          item != null && !this.selectedItems.includes(item)
        );
        this.selectedItems = [...this.selectedItems, ...newSelections];
      }
    }

    this.onSelectionChange();
  }



  /**
   * Verifica si el estado es indeterminado (algunos seleccionados pero no todos)
   */
  isIndeterminate(): boolean {
    if (!this.config.selection || !this.table) {
      return false;
    }
    const filteredData = this.table.filteredValue || this.config.data;
    if (filteredData.length === 0 || !filteredData) {
      return false;
    }
    const dataKey = this.config.dataKey;
    let selectedCount = 0;

    if (dataKey) {
      // Filtrar items nulos antes de mapear
      const validSelectedItems = this.selectedItems.filter(item => item != null);
      const selectedKeys = new Set(validSelectedItems.map(item => item && item[dataKey] != null ? item[dataKey] : null).filter(key => key != null));
      selectedCount = filteredData.filter(item => item != null && item[dataKey] != null && selectedKeys.has(item[dataKey])).length;
    } else {
      selectedCount = filteredData.filter(item => item != null && this.selectedItems.includes(item)).length;
    }

    return selectedCount > 0 && selectedCount < filteredData.length;
  }

  /**
   * Registra el filtro personalizado para fechas
   */
  private registerCustomDateFilter(): void {
    this.filterService.register('customDateFilter', customDateFilter);
  }

  /**
   * Inicializa los filtros según las columnas
   */
  private initializeFilters(): void {
    this.config.columns.forEach(col => {
      if (col.filterType && col.filterType !== FilterType.NONE) {
        this.filtros[col.field] = col.filterType === FilterType.DATE ? null : '';
      }
    });
  }

  /**
   * Aplica filtro global
   */
  applyGlobalFilter(event: Event, table?: Table): void {
    const target = event.target as HTMLInputElement;
    const tableInstance = table || this.table;
    if (tableInstance) {
      if (!this.config?.lazy) {
        tableInstance.filterGlobal(target.value, 'contains');
      }
      this.filtroGlobalValue = target.value;
      this.emitFiltersChange({ global: this.filtroGlobalValue });
    }
  }

  /**
   * Limpia todos los filtros
   */
  clear(table?: Table, searchInput?: HTMLInputElement): void {
    const tableInstance = table || this.table;
    if (tableInstance) {
      if (!this.config?.lazy) {
        tableInstance.clear();
        tableInstance.filterGlobal('', 'contains');
      }
      this.filtroGlobalValue = '';
      this.filtros = {};
      this.initializeFilters();
      if (searchInput) {
        searchInput.value = '';
      }
      this.emitFiltersChange({ filters: { ...this.filtros }, global: this.filtroGlobalValue });
      // Emitir evento para limpiar filtros adicionales del caption
      this.clearCaptions.emit();
    }
  }

  /**
   * Indica si el botón de limpiar debe estar habilitado
   */
  get canClear(): boolean {
    // Verificar filtro global
    if (this.filtroGlobalValue && (typeof this.filtroGlobalValue === 'string' ? this.filtroGlobalValue.trim() !== '' : true)) {
      return true;
    }

    // Verificar filtros por columna
    for (const key of Object.keys(this.filtros || {})) {
      const v = this.filtros[key];
      if (v == null) continue;
      if (typeof v === 'string' && v.trim() === '') continue;
      if (Array.isArray(v) && v.length === 0) continue;
      // fechas, números, booleanos y otros valores cuentan como datos ingresados
      return true;
    }

    return false;
  }

  /**
   * Alterna visibilidad de filtros
   */
  toggleFiltros(): void {
    // Si los filtros están visibles, limpiarlos antes de ocultarlos
    if (this.filtrosVisibles) {
      this.clear(this.table);
      this.filtrosVisibles = false;
    } else {
      this.filtrosVisibles = true;
    }
  }

  /**
   * Aplica filtro de texto
   */
  applyTextFilter(value: string, field: string, table: Table): void {
    this.filtros[field] = value;
    if (!this.config?.lazy) {
      table.filter(value, field, 'contains');
    }
    this.emitFiltersChange({ field, value, filters: { ...this.filtros } });
  }

  /**
   * Aplica filtro de número
   */
  applyNumberFilter(value: string, field: string, table: Table): void {
    this.filtros[field] = value;
    if (!this.config?.lazy) {
      table.filter(value, field, 'equals');
    }
    this.emitFiltersChange({ field, value, filters: { ...this.filtros } });
  }

  /**
   * Aplica filtro de dropdown
   */
  applyDropdownFilter(value: unknown, field: string, table: Table): void {
    this.filtros[field] = value;
    if (!this.config?.lazy) {
      table.filter(value, field, 'equals');
    }
    this.emitFiltersChange({ field, value, filters: { ...this.filtros } });
  }

  /**
   * Aplica filtro de fecha
   */
  onDatePickerSelect(selectedDate: Date, field: string, table: Table): void {
    if (selectedDate) {
      const formattedDate = formatDateForComparison(selectedDate);
      if (!this.config?.lazy) {
        table.filter(formattedDate, field, 'customDateFilter');
      }
      this.filtros[field] = selectedDate;
    } else {
      if (!this.config?.lazy) {
        table.filter('', field, 'contains');
      }
      this.filtros[field] = null;
    }
    this.emitFiltersChange({ field, value: this.filtros[field], filters: { ...this.filtros } });
  }

  onPageChange(event: TablePageEvent): void {
    const rows = event.rows ?? this.config?.rowsPerPage ?? 0;
    const first = event.first ?? 0;
    const page = rows > 0 ? Math.floor(first / rows) : 0;
    this.pageChange.emit({
      page,
      rows,
      first
    });
  }

  onSort(event: { field?: string; order?: number }): void {
    try {
      const field = event?.field;
      const order = event?.order;
      this.sortChange.emit({ field, order });
    } catch (err) {
      console.error('Error handling sort event', err);
    }
  }

  private emitFiltersChange(payload: { field?: string; value?: unknown; global?: string; filters?: Record<string, unknown> }): void {
    this.filtersChange.emit(payload);
  }

  emitFilterInput(payload: unknown): void {
    this.filterInput.emit(payload);
  }

  onGlobalSearchEnter(event: Event): void {
    // Emitir el valor actual del campo de búsqueda cuando se presiona Enter
    this.globalSearchEnter.emit(this.filtroGlobalValue ?? '');
  }

  onGlobalInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.filtroGlobalValue = target?.value ?? '';
    const trigger = this.config?.globalSearchTrigger ?? 'type';
    if (trigger === 'type') {
      // Comportamiento por defecto: filtrar mientras escribe (mantener compatibilidad)
      this.applyGlobalFilter(event);
    } else {
      // No filtrar en cliente mientras se escribe; solo emitir cambio de filtros (si alguien lo escucha)
      this.emitFiltersChange({ global: this.filtroGlobalValue });
    }
  }

  /**
   * Obtiene el label de un valor (para dropdowns)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLabel(column: TableColumn, value: any): string {
    if (column.getLabel) {
      return column.getLabel(value);
    }
    if (column.dropdownOptions) {
      const option = column.dropdownOptions.find(opt => opt.value === value);
      return option ? option.label : String(value ?? '');
    }
    return String(value ?? '');
  }

  /**
   * Maneja el clic en una fila
   */
  onRowClick(row: TableRow, index: number, event?: Event): void {
    if (this.isMobile) {
      // En móvil, solo expandir/contraer, no emitir evento ni seleccionar
      // No usar preventDefault() porque bloquea la expansión
      if (event) {
        event.stopPropagation();
      }
      this.toggleRowExpansion(index);
    } else {
      // Si alguna columna es clickable, no emitir rowClick aquí (solo se emite desde onCellClick)
      const hasClickableColumn = this.config.columns?.some(col => col.clickable);
      if (!hasClickableColumn) {
        this.rowClick.emit(row);
      }
    }
  }

  /**
   * Maneja el clic en una celda específica
   */
  onCellClick(row: TableRow, column: TableColumn, event: Event): void {
    event.stopPropagation();
    // Si la columna está marcada como clickeable, emitir el evento
    if (column.clickable) {
      this.rowClick.emit(row);
    }
  }

  /**
   * Maneja el clic en la celda del checkbox para prevenir que se expanda la fila en móvil
   */
  onCheckboxCellClick(event: Event): void {
    // Detener la propagación para que no se expanda la fila en móvil
    event.stopPropagation();
  }

  /**
   * Verifica si una fila puede ser seleccionada
   */
  isRowSelectable(row: TableRow): boolean {
    if (!this.config.selection) {
      return false;
    }
    if (this.config.isRowSelectable) {
      return this.config.isRowSelectable(row);
    }
    return true;
  }

  /**
   * Obtiene las clases CSS para una fila
   */
  getRowClass(row: TableRow, rowIndex?: number): string {
    const classes: string[] = [];
    const customClass = this.config.getRowClass?.(row);

    if (customClass) {
      classes.push(customClass);
    }

    if (rowIndex != null && this.activeContextRow === rowIndex) {
      // Aplicar ambas clases para cubrir casos de menú de acciones y menú contextual
      classes.push('row-actions-active');
      classes.push('context-menu-active');
    }

    return classes.join(' ');
  }

  /**
   * Toggle de expansión de fila para móvil
   * Solo permite una fila expandida a la vez (comportamiento de acordeón)
   */
  toggleRowExpansion(rowIndex: number): void {
    if (this.expandedRows.has(rowIndex)) {
      // Si la fila ya está expandida, cerrarla
      this.expandedRows.delete(rowIndex);
    } else {
      // Si se va a expandir una nueva fila, cerrar todas las demás primero
      this.expandedRows.clear();
      // Luego expandir la nueva fila
      this.expandedRows.add(rowIndex);
    }
  }

  /**
   * Verifica si una fila está expandida
   */
  isRowExpanded(rowIndex: number): boolean {
    return this.expandedRows.has(rowIndex);
  }

  /**
   * Obtiene las columnas visibles en móvil
   */
  getMobileVisibleColumns(): TableColumn[] {
    return this.config.columns.filter(col => col.mobileVisible !== false && !col.isAction);
  }

  /**
   * Obtiene las columnas ocultas en móvil
   */
  getMobileHiddenColumns(): TableColumn[] {
    return this.config.columns.filter(col => col.mobileVisible === false && !col.isAction);
  }

  /**
   * Obtiene el número de columnas visibles en móvil (para colspan)
   */
  getMobileVisibleColumnsCount(): number {
    // Contar columnas visibles (mobileVisible !== false o es acción)
    const visibleColumns = this.config.columns.filter(col => col.mobileVisible !== false || col.isAction).length;
    // Si hay selección habilitada, agregar 1 para la columna de checkbox
    return this.config.selection ? visibleColumns + 1 : visibleColumns;
  }

  /**
   * Obtiene el valor formateado de una celda
   */
  getCellValue(column: TableColumn, row: TableRow): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = this.getNestedValue(row, column.field) as any;

    if (column.type === ColumnType.NUMBER && value != null) {
      try {
        // Convertir string a número si es necesario
        const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : Number(value);
        if (isNaN(numValue)) {
          return String(value ?? '-');
        }

        if (column.numberFormat) {
          const formatParts = column.numberFormat.split('.');
          if (formatParts.length > 1) {
            const fractionPart = formatParts[1].split('-');
            const minDigits = parseInt(fractionPart[0] || '0', 10);
            const maxDigits = parseInt(fractionPart[1] || fractionPart[0] || '0', 10);
            const locale = column.numberLocale || 'es-ES';
            return new Intl.NumberFormat(locale, {
              minimumFractionDigits: minDigits,
              maximumFractionDigits: maxDigits
            }).format(numValue);
          }
        }
        return String(numValue);
      } catch {
        return String(value ?? '-');
      }
    }

    if (column.type === ColumnType.NUMBER && value == null) {
      return '-';
    }

    if (column.type === ColumnType.DATE && value) {
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return '-';
        }
        return column.dateFormat ? this.formatDate(date, column.dateFormat) : date.toLocaleDateString('es-ES');
      } catch {
        return '-';
      }
    }

    if (column.type === ColumnType.DATE && !value) {
      return '-';
    }

    if (column.type === ColumnType.BOOLEAN) {
      if (value == null) {
        return '-';
      }
      // Si se proporciona getLabel o dropdownOptions, usarlo (permite labels personalizados)
      if (column.getLabel || column.dropdownOptions) {
        return this.getLabel(column, value);
      }
      // Valor por defecto para booleanos
      return value ? 'Sí' : 'No';
    }

    if (column.type === ColumnType.DROPDOWN && value != null) {
      return this.getLabel(column, value);
    }

    return value != null ? String(value) : '-';
  }

  /**
   * Actualiza el cache de las celdas del footer
   */
  private updateFooterCells(): void {
    if (!this.config || !this.config.onFooter) {
      this.footerCellsCache = [];
      return;
    }
    try {
      const footerData = this.config.onFooter() as { cells?: TableRow[] } | undefined;
      this.footerCellsCache = footerData?.cells || [];
    } catch (error) {
      console.error('Error al obtener datos del footer:', error);
      this.footerCellsCache = [];
    }
  }

  /**
   * Obtiene las celdas del footer (desde cache)
   */
  getFooterCells(): TableRow[] {
    return this.footerCellsCache;
  }

  /**
   * Verifica si el footer debe mostrarse
   */
  get shouldShowFooter(): boolean {
    return !!(this.config?.onFooter &&
              this.config?.data &&
              this.config.data.length > 0 &&
              this.footerCellsCache.length > 0);
  }

  /**
   * Obtiene un valor anidado de un objeto
   */
  getNestedValue(obj: TableRow, path: string): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return path.split('.').reduce((current: any, prop: string) => current?.[prop], obj);
  }



   /**
   * Determina si una celda debe renderizarse cuando hay agrupación por rowspan
   */
  shouldRenderCell(rowIndex: number, column: TableColumn): boolean {
    if (!this.isGroupedColumn(column)) {
      return true;
    }

    const data = this.getRenderedRows();
    const renderedIndex = this.toRenderedIndex(rowIndex, data.length);
    const groupField = this.config?.rowGroup?.field;
    if (!groupField || renderedIndex < 0 || renderedIndex >= data.length) {
      return true;
    }

    if (renderedIndex === 0) {
      return true;
    }

    const currentValue = this.getNestedValue(data[renderedIndex], groupField);
    const previousValue = this.getNestedValue(data[renderedIndex - 1], groupField);

    return !this.areGroupValuesEqual(currentValue, previousValue);
  }

  /**
   * Obtiene el rowspan de una celda agrupada
   */
  getCellRowspan(rowIndex: number, column: TableColumn): number | null {
    if (!this.isGroupedColumn(column) || !this.shouldRenderCell(rowIndex, column)) {
      return null;
    }

    const data = this.getRenderedRows();
    const renderedIndex = this.toRenderedIndex(rowIndex, data.length);
    const groupField = this.config?.rowGroup?.field;
    if (!groupField || renderedIndex < 0 || renderedIndex >= data.length) {
      return null;
    }

    const currentValue = this.getNestedValue(data[renderedIndex], groupField);
    let rowspan = 1;

    for (let i = renderedIndex + 1; i < data.length; i++) {
      const nextValue = this.getNestedValue(data[i], groupField);
      if (!this.areGroupValuesEqual(currentValue, nextValue)) {
        break;
      }
      rowspan++;
    }

    return rowspan > 1 ? rowspan : null;
  }

  /**
   * Verifica si una columna es la columna configurada para agrupar filas
   */
  private isGroupedColumn(column: TableColumn): boolean {
    const groupField = this.config?.rowGroup?.field;
    const enabled = this.config?.rowGroup?.enabled !== false;
    return !!groupField && enabled && column.field === groupField;
  }

  /**
   * Obtiene las filas actualmente renderizadas (respeta filtros y paginación)
   */
  private getRenderedRows(): TableRow[] {
    const filteredData = this.table?.filteredValue || this.config?.data || [];
    if (!Array.isArray(filteredData) || filteredData.length === 0) {
      return [];
    }

    const isPaginatorEnabled = this.table?.paginator === true;
    if (!isPaginatorEnabled) {
      return filteredData;
    }

    const first = this.table?.first || 0;
    const rows = this.table?.rows || filteredData.length;
    return filteredData.slice(first, first + rows);
  }

  /**
   * Convierte un índice de fila del template al índice relativo del arreglo renderizado.
   */
  private toRenderedIndex(rowIndex: number, renderedLength: number): number {
    if (rowIndex < renderedLength) {
      return rowIndex;
    }

    const first = this.table?.first || 0;
    return rowIndex - first;
  }

  /**
   * Compara dos valores de agrupación
   */
  private areGroupValuesEqual(left: unknown, right: unknown): boolean {
    const normalize = (value: unknown): string => {
      if (value == null) {
        return '';
      }
      return String(value).trim();
    };

    return normalize(left) === normalize(right);
  }
  /**
   * Formatea una fecha según el formato especificado
   */
  private formatDate(date: Date, format: string): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return format
      .replace('dd', day)
      .replace('MM', month)
      .replace('yyyy', year.toString())
      .replace('HH', hours)
      .replace('mm', minutes);
  }

  /**
   * Maneja la exportación
   */
  exportData(): void {
    if (this.config.onExport) {
      const dataToExport = this.table?.filteredValue || this.config.data;
      this.config.onExport(dataToExport);
    }
  }

  /**
   * Maneja el clic en agregar
   */
  handleAdd(): void {
    if (this.config.onAdd) {
      this.config.onAdd();
    }
  }

  /**
   * Maneja el clic en una acción
   */
  handleAction(action: TableAction, row: any, index: number, event?: Event): void {
    event?.stopPropagation();
    this.executeAction(action, row, index);
  }

  openActionMenu(menuRef: Menu, row: any, rowIndex: number, event: Event | { originalEvent?: Event }): void {
    const triggerEvent = this.getOriginalEvent(event);
    triggerEvent.stopPropagation();

    if (this.activeMenuRef === menuRef) {
      this.activeMenuRef = null;
      this.activeContextRow = null;
      menuRef.toggle(triggerEvent);
      return;
    }

    if (this.activeMenuRef && this.activeMenuRef !== menuRef) {
      this.activeMenuRef.hide();
    }

    // Indicar que vamos a abrir el menú de acciones para esta fila
    this.preserveRowHighlightOnActionMenuHide = true;
    // Cerrar menú contextual de celdas si estuviera abierto (al cambiar a menú de acciones)
    this.closeCellContextMenu();
    // Marcar la fila como activa antes de abrir el menú para que el estilo se aplique inmediatamente
    this.activeContextRow = rowIndex;
    this.activeMenuRef = menuRef;
    menuRef.toggle(triggerEvent);
  }

  onActionMenuHide(menuRef?: Menu): void {
    if (!menuRef || this.activeMenuRef === menuRef) {
      this.activeMenuRef = null;
    }

    // Si todavía hay algún menú visible (p.ej. el context menu), no quitar el highlight.
    const contextMenuVisible = !!(this.cellContextMenu && (this.cellContextMenu as any).container && (this.cellContextMenu as any).container.offsetParent);

    if (contextMenuVisible || this.activeMenuRef) {
      // Si estábamos preservando el highlight por cambio de menú, resetear la bandera pero mantener la clase
      this.preserveRowHighlightOnActionMenuHide = false;
      return;
    }

    // No hay menús visibles: quitar el highlight
    this.activeContextRow = null;
  }

  // =======================CONTEXT MENU DE CELDAS ========================

  onCellContextMenu(event: MouseEvent, row: any, col: any, rowIndex: number): void {
    event.preventDefault();
    event.stopPropagation();

    // Evitar abrir el menú contextual para columnas compuestas (p.ej. "subcategoria").
    // También se soporta una propiedad por columna `preventContextMenu` para bloquearlo.
    const fieldName = String(col?.field || '').toLowerCase();
    if (fieldName.includes('subcategoria') || col?.preventContextMenu === true) {
      return;
    }
    const items: MenuItem[] = [];

    if (!col?.isAction) {
      const cellValue = String(this.getNestedValue(row, col?.field) ?? '');
      items.push({
        label: 'Copiar dato',
        icon: 'pi pi-copy',
        command: () => this.copyToClipboard(cellValue)
      });
    }

    const actionItems = this.getActionMenuItems(row, rowIndex);
    if (actionItems.length > 0) {
      if (items.length > 0) {
        items.push({ separator: true });
      }
      items.push(...actionItems);
    }

    if (items.length > 0) {
      // Ocultar cualquier menú de acciones antes de mostrar el menú contextual
      this.activeMenuRef?.hide();
      // Marcar la fila como activa para aplicar el highlight mientras el contextmenu esté visible
      this.activeContextRow = rowIndex;
      this.contextMenuItems = items;
      this.cellContextMenu?.show(event);
    }
  }

  onContextMenuHide(): void {
    // Si hay todavía un menú de acciones abierto, mantener el highlight
    if (this.activeMenuRef) {
      this.preserveRowHighlightOnActionMenuHide = false;
      return;
    }

    this.activeContextRow = null;
  }

  getActionMenuItems(row: any, rowIndex: number): MenuItem[] {
    const visibleActions = this.getVisibleRowActions(row);
    const signature = visibleActions.map((action) => this.buildActionSignature(action, row));
    const cachedMenu = this.menuItemsCache.get(row);

    if (cachedMenu && this.isSameSignature(cachedMenu.signature, signature)) {
      return cachedMenu.items;
    }

    const items = visibleActions.map((action) => ({
      label: this.getActionLabel(action, row) || this.t('common.action', 'Acción'),
      icon: this.getActionIcon(action, row),
      disabled: this.isActionDisabled(action, row),
      styleClass: this.getActionMenuStyleClass(action, row),
      command: (menuEvent?: { originalEvent?: Event }) => {
        const originalEvent = menuEvent?.originalEvent;
        originalEvent?.stopPropagation?.();
        originalEvent?.preventDefault?.();
        this.executeAction(action, row, rowIndex);
      }
    }));

    this.menuItemsCache.set(row, { signature, items });
    return items;
  }

  copyToClipboard(value: any): void {
    const text = value == null ? '' : String(value);
    if (!text) return;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => this.fallbackCopy(text));
    } else {
      this.fallbackCopy(text);
    }
  }

  private fallbackCopy(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  /**
   * Maneja el clic en una acción
   */
  private executeAction(action: TableAction, row: any, index: number): void {
    if (!this.isActionDisabled(action, row)) {
      action.action(row, index);
    }
  }

  /**
   * Verifica si una acción está deshabilitada
   */
  isActionDisabled(action: TableAction, row: any): boolean {
    return action.disabled ? action.disabled(row) : false;
  }

  /**
   * Verifica si una acción debe ser visible
   */
  canShowAction(action: TableAction, row: any): boolean {
    if (typeof action?.permission === 'function') {
      try {
        return !!action.permission(row);
      } catch {
        return false;
      }
    }

    return action?.permission !== false;
  }

  isActionVisible(action: TableAction, row: any): boolean {
    return this.canShowAction(action, row);
  }

  /**
   * Obtiene tooltip de acción (soporta función por fila)
   */
  getActionTooltip(action: TableAction, row: any): string | undefined {
    if (!action?.tooltip) return undefined;
    return typeof action.tooltip === 'function' ? action.tooltip(row) : action.tooltip;
  }

  /**
   * Obtiene label de acción (soporta función por fila y fallback a tooltip)
   */
  getActionLabel(action: TableAction, row: any): string {
    if (action?.label) {
      return typeof action.label === 'function' ? action.label(row) : action.label;
    }
    return this.getActionTooltip(action, row) || '';
  }

  getInlineEditAction(row: any): TableAction | null {
    const visibleActions = this.getVisibleRowActions(row);
    if (visibleActions.length !== 1) {
      return null;
    }

    return this.isEditAction(visibleActions[0], row) ? visibleActions[0] : null;
  }

  onInlineEditActionClick(action: TableAction, row: any, rowIndex: number, event: Event): void {
    event.stopPropagation();
    this.executeAction(action, row, rowIndex);
  }

  /**
   * Actualiza el estado móvil
   */
  @HostListener('window:resize')
  onResize(): void {
    this.updateIsMobile();
  }

  private updateIsMobile(): void {
    try {
      this.isMobile = window.innerWidth <= 1024;
    } catch {
      this.isMobile = false;
    }
  }

  /**
   * Obtiene los campos para el filtro global
   */
  getGlobalFilterFields(): string[] {
    if (this.config.globalFilterFields) {
      return this.config.globalFilterFields;
    }
    return this.config.columns
      .filter(col => col.globalFilter !== false && col.type !== ColumnType.CUSTOM)
      .map(col => col.field);
  }

  /**
   * Obtiene las clases CSS para una columna
   */
  getColumnClasses(col: TableColumn): string {
    const classes: string[] = [];
    if (col.mobileVisible === false) {
      classes.push('col-hide-mobile');
    }
    if (col.mobileOnly === true) {
      classes.push('col-only-mobile');
    }
    if (col.cssClass) {
      classes.push(col.cssClass);
    }
    return classes.join(' ');
  }

  /**
   * Obtiene los estilos inline para una columna (anchos)
   */
  getColumnStyles(col: TableColumn): { [key: string]: string } {
    const styles: { [key: string]: string } = {};
    if (col.width) {
      styles['width'] = col.width;
    }
    if (col.minWidth) {
      styles['min-width'] = col.minWidth;
    }
    if (col.maxWidth) {
      styles['max-width'] = col.maxWidth;
    }
    return styles;
  }

  /**
   * Obtiene los estilos para la columna de checkbox
   */
  getCheckboxColumnStyles(): { [key: string]: string } {
    const mobileWidth = this.config?.checkboxColumnWidthMobile || this.config?.checkboxColumnWidth || '1.5rem';
    const desktopWidth = this.config?.checkboxColumnWidth || '1.5rem';

    if (this.isMobile) {
      return {
        '--checkbox-column-width': mobileWidth,
        'width': mobileWidth,
        'min-width': mobileWidth,
        'max-width': mobileWidth,
        'padding': '0.25rem',
        'box-sizing': 'border-box'
      };
    }
    return {
      '--checkbox-column-width': desktopWidth,
      'width': desktopWidth,
      'min-width': desktopWidth,
      'max-width': desktopWidth,
      'padding': '0.5rem',
      'box-sizing': 'border-box'
    };
  }

  /**
   * Obtiene la severidad del botón (compatible con PrimeNG)
   */
  getActionSeverity(action: TableAction, row: any): 'success' | 'info' | 'danger' | 'secondary' | 'help' | 'contrast' | null {
    if (!action?.severity) return null;
    const raw = typeof action.severity === 'function' ? action.severity(row) : action.severity;
    // Mapear 'warning' a 'help' para compatibilidad con PrimeNG
    const severity = raw === 'warning' ? 'help' : raw;
    const validSeverities: ('success' | 'info' | 'danger' | 'secondary' | 'help' | 'contrast')[] =
      ['success', 'info', 'danger', 'secondary', 'help', 'contrast'];
    return validSeverities.includes(severity) ? severity : 'info';
  }

  getActionIcon(action: TableAction, row: any): string | undefined {
    if (!action?.icon) return undefined;
    return typeof action.icon === 'function' ? action.icon(row) : action.icon;
  }

  getActionStyleClass(action: TableAction, row: any): string | undefined {
    if (!action?.styleClass) return undefined;
    return typeof action.styleClass === 'function' ? action.styleClass(row) : action.styleClass;
  }

  private closeCellContextMenu(): void {
    try {
      this.cellContextMenu?.hide();
    } catch {
      // no-op
    }
  }

  private clearActionMenuCache(): void {
    this.menuItemsCache = new WeakMap();
  }

  getVisibleRowActions(row: any): TableAction[] {
    return (this.config?.rowActions || []).filter((action) => this.canShowAction(action, row));
  }

  private isEditAction(action: TableAction, row: any): boolean {
    const icon = String(this.getActionIcon(action, row) || '').toLowerCase();
    const descriptor = `${this.getActionLabel(action, row)} ${this.getActionTooltip(action, row) || ''}`
      .toLowerCase()
      .trim();

    return (
      descriptor.includes('editar') ||
      descriptor.includes('edit') ||
      icon.includes('pencil') ||
      icon.includes('file-edit') ||
      icon.includes('pi-edit')
    );
  }

  private getActionMenuStyleClass(action: TableAction, row: any): string {
    const classMap: Record<string, string> = {
      'btn-primary': 'primary',
      'btn-secondary': 'secondary',
      'btn-success': 'success',
      'btn-info': 'info',
      'btn-warning': 'warning',
      'btn-danger': 'danger'
    };

    const blockedButtonClasses = new Set([
      'btn-icon-only',
      'btn-rounded',
      'btn-sm',
      'btn-md',
      'btn-lg',
      'btn-v2'
    ]);

    const classes = ['action-menu-item'];
    const severity = this.getActionSeverity(action, row);
    const styleClass = this.getActionStyleClass(action, row);

    if (severity) {
      classes.push(severity);
    }

    if (styleClass) {
      String(styleClass)
        .split(/\s+/)
        .filter(Boolean)
        .forEach((cssClass) => {
          if (blockedButtonClasses.has(cssClass) || cssClass.startsWith('p-button')) {
            return;
          }

          classes.push(classMap[cssClass] || cssClass);
        });
    }

    if (classes.length === 1) {
      classes.push('secondary');
    }

    return [...new Set(classes)].join(' ');
  }

  private buildActionSignature(action: TableAction, row: any): string {
    return JSON.stringify({
      label: this.getActionLabel(action, row),
      icon: this.getActionIcon(action, row),
      tooltip: this.getActionTooltip(action, row),
      disabled: this.isActionDisabled(action, row),
      severity: this.getActionSeverity(action, row),
      styleClass: this.getActionStyleClass(action, row)
    });
  }

  private isSameSignature(current: string[], next: string[]): boolean {
    if (current.length !== next.length) {
      return false;
    }

    return current.every((value, index) => value === next[index]);
  }

  private getOriginalEvent(event: Event | { originalEvent?: Event }): Event {
    return (event as { originalEvent?: Event })?.originalEvent || (event as Event);
  }
}

