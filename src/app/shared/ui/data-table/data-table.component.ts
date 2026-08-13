import { Component, computed, contentChildren, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import type { DataTableColumn, DataTableFilterType } from './data-table.model';
import { DataTableCellDirective } from './data-table-cell.directive';

/**
 * Tabla genérica sobre `p-table`: arma encabezado, orden por columna y
 * paginador a partir de `columns`, con búsqueda manual opcional en el
 * `caption` (solo filtra al hacer clic en "Buscar" o Enter, no en cada
 * tecla) y una fila de filtros por columna (texto/número/dropdown/fecha,
 * togglable con "Filtrar") para las columnas que definen `filterType`. El
 * contenido de cada celda se proyecta por columna con `DataTableCellDirective`;
 * sin plantilla, se muestra el valor crudo del campo.
 *
 * Base tomada de `docs/data-table` (tabla compartida del STG legado) —
 * reimplementada en standalone/signals y recortada a lo que este Host
 * necesita hoy (sin export a Excel, selección, menú contextual, edición
 * inline, expansión móvil ni footer; se puede ampliar cuando algún
 * consumidor lo requiera).
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, SelectModule, DatePickerModule, TooltipModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css',
})
export class DataTableComponent<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly columns = input.required<DataTableColumn[]>();
  readonly data = input.required<T[]>();
  readonly loading = input(false);
  readonly rows = input(10);
  readonly rowsPerPageOptions = input([10, 25, 50]);
  readonly scrollHeight = input<string>();
  readonly emptyMessage = input('No se encontraron registros.');
  readonly emptyHint = input('Ajusta la búsqueda o los filtros para ver más resultados.');
  /** Campos por los que busca `buscar()`. Vacío (por defecto) oculta el buscador del caption. */
  readonly searchFields = input<string[]>([]);
  readonly searchPlaceholder = input('Buscar...');
  /** Muestra el botón "Actualizar" del caption — el consumidor decide qué hacer al escuchar `refrescar`. */
  readonly showRefreshButton = input(false);
  readonly refrescar = output<void>();

  private readonly celdas = contentChildren(DataTableCellDirective);

  protected readonly mostrarBuscador = computed(() => this.searchFields().length > 0);
  protected readonly hayColumnasFiltrable = computed(() => this.columns().some((c) => !!c.filterType));

  protected readonly busqueda = signal('');
  protected readonly filtrosVisibles = signal(false);
  protected readonly filtrosColumna = signal<Record<string, unknown>>({});

  protected readonly hayFiltrosActivos = computed(() =>
    Object.values(this.filtrosColumna()).some((v) => v !== undefined && v !== null && v !== '')
  );

  protected readonly filasFiltradas = computed<T[]>(() => {
    let filas = this.data();

    const filtros = this.filtrosColumna();
    for (const col of this.columns()) {
      const valor = filtros[col.field];
      if (valor === undefined || valor === null || valor === '') continue;
      filas = filas.filter((fila) => this.coincideFiltroColumna(fila[col.field], valor, col.filterType));
    }

    const q = this.busqueda().toLowerCase().trim();
    const campos = this.searchFields();
    if (q && campos.length > 0) {
      filas = filas.filter((fila) => campos.some((campo) => String(fila[campo] ?? '').toLowerCase().includes(q)));
    }

    return filas;
  });

  protected buscar(valor: string): void {
    this.busqueda.set(valor);
  }

  protected toggleFiltros(): void {
    const nuevoValor = !this.filtrosVisibles();
    this.filtrosVisibles.set(nuevoValor);
    if (!nuevoValor) this.filtrosColumna.set({});
  }

  protected limpiarFiltros(): void {
    this.filtrosColumna.set({});
  }

  protected aplicarFiltroColumna(field: string, valor: unknown): void {
    this.filtrosColumna.update((actual) => ({ ...actual, [field]: valor }));
  }

  protected plantillaPara(field: string) {
    return this.celdas().find((c) => c.appDataTableCell() === field)?.templateRef ?? null;
  }

  protected valorCelda(col: DataTableColumn, row: T): unknown {
    const valor = row[col.field];
    return valor === null || valor === undefined || valor === '' ? '-' : valor;
  }

  private coincideFiltroColumna(valorCelda: unknown, valorFiltro: unknown, tipo?: DataTableFilterType): boolean {
    if (tipo === 'number') return Number(valorCelda) === Number(valorFiltro);
    if (tipo === 'dropdown') return valorCelda === valorFiltro;
    if (tipo === 'date') {
      const claveCelda = this.claveFecha(valorCelda);
      const claveFiltro = this.claveFecha(valorFiltro);
      return !!claveCelda && claveCelda === claveFiltro;
    }
    return String(valorCelda ?? '')
      .toLowerCase()
      .includes(String(valorFiltro).toLowerCase().trim());
  }

  /**
   * Clave `YYYY-MM-DD` de un valor de fecha, comparando solo el día
   * calendario (sin hora). Si el valor ya es un string `YYYY-MM-DD[...]`
   * (el formato que devuelve el backend Ant), se toma tal cual — evita
   * pasar por `new Date('YYYY-MM-DD')`, que ECMA-262 interpreta como
   * medianoche UTC y que, al leerla luego en hora local (América,
   * UTC negativo), corre la fecha un día hacia atrás.
   */
  private claveFecha(valor: unknown): string | null {
    if (valor instanceof Date) {
      if (isNaN(valor.getTime())) return null;
      const anio = valor.getFullYear();
      const mes = String(valor.getMonth() + 1).padStart(2, '0');
      const dia = String(valor.getDate()).padStart(2, '0');
      return `${anio}-${mes}-${dia}`;
    }

    const texto = String(valor ?? '').trim();
    const isoDirecto = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto);
    if (isoDirecto) return `${isoDirecto[1]}-${isoDirecto[2]}-${isoDirecto[3]}`;

    const fecha = new Date(texto);
    return isNaN(fecha.getTime()) ? null : this.claveFecha(fecha);
  }
}
