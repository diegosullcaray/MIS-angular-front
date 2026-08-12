import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import type { ColumnaTabla, TipoColumna } from '../../models';
import { formatearNumero } from '../../../../../shared/utils/formato.util';

/** Fila genérica de la tabla — cualquier objeto plano (`FilaLineaSimple`, `ResponsableFila`, `LogVerificacionFila`...). */
export type FilaTabla = Record<string, unknown>;

/** Evento de edición de una celda — igual forma que `editCell(evt)` del legado. */
export interface CeldaEditadaEvent<T extends FilaTabla = FilaTabla> {
  fila: T;
  key: string;
  valor: unknown;
}

/**
 * Tabla editable genérica de Presupuesto — reemplaza al `stg-table` legado
 * (`customComponentCell`/`customComponentStyler`/`onEditCell`) con el propio
 * mecanismo de edición inline de PrimeNG (`pEditableColumn`/`p-cellEditor`).
 * Soporta un nivel de columnas agrupadas (`ColumnaTabla.hijos`, ver Cartera
 * Créditos: "Desembolso"/"Cancelación").
 *
 * Cada celda decide si es editable con `esEditable(fila, key)` — equivalente
 * al `customComponent()` legado, pero como una función que le pasa la
 * pantalla dueña de la regla de negocio (nivel jerárquico activo, ventana de
 * edición, admin/responsable) en vez de repetir esa lógica acá.
 */
@Component({
  selector: 'app-editable-table',
  standalone: true,
  imports: [TableModule, FormsModule, InputTextModule, SkeletonModule],
  templateUrl: './editable-table.component.html',
  styleUrl: './editable-table.component.css',
})
export class EditableTableComponent<T extends FilaTabla = FilaTabla> {
  readonly columnas = input.required<ColumnaTabla[]>();
  readonly filas = input<T[]>([]);
  readonly cargando = input(false);
  /** `() => false` (todo de solo lectura) si no se provee — ej. Comp. Prod. Monto/Ratio. */
  readonly esEditable = input<(fila: T, key: string) => boolean>(() => false);
  readonly celdaEditada = output<CeldaEditadaEvent<T>>();

  protected readonly tieneGrupos = computed(() => this.columnas().some((c) => (c.hijos?.length ?? 0) > 0));

  protected readonly columnasPlanas = computed<ColumnaTabla[]>(() =>
    this.columnas().flatMap((col) => (col.hijos?.length ? col.hijos : [col]))
  );

  protected onCambio(fila: T, key: string, valor: unknown): void {
    (fila as FilaTabla)[key] = valor;
    this.celdaEditada.emit({ fila, key, valor });
  }

  protected formatear(valor: unknown, tipo: TipoColumna | undefined): string {
    if (valor === null || valor === undefined || valor === '') return '';
    const num = Number(valor);
    if (Number.isNaN(num)) return String(valor);

    if (tipo === 'percent') {
      // toFixed, no formatearPorcentaje: acá el legado muestra siempre 2
      // decimales y sin separador de miles.
      return `${(num * 100).toFixed(2)}%`;
    }
    if (tipo === 'text') {
      return String(valor);
    }
    return formatearNumero(num);
  }
}
