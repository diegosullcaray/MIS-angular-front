import { Component, computed, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { aplanarEncabezados } from '../../utils/tabla-dinamica.util';
import type { ColumnaDinamica } from '../../models/tabla-dinamica.model';

/** Tabla del motor `table.regular` (columnas dinámicas) — reemplaza a `stg-table2` del legado (`shared/components/stg-table2`). */
@Component({
  selector: 'app-tabla-dinamica',
  standalone: true,
  imports: [TableModule],
  templateUrl: './tabla-dinamica.component.html',
  styleUrl: './tabla-dinamica.component.css',
})
export class TablaDinamicaComponent {
  readonly columnas = input.required<ColumnaDinamica[]>();
  readonly filas = input.required<Record<string, unknown>[]>();
  readonly cargando = input(false);

  protected readonly encabezados = computed(() => aplanarEncabezados(this.columnas()));

  protected valor(fila: Record<string, unknown>, columna: ColumnaDinamica): unknown {
    return fila[columna.key];
  }

  /** Fila "destacada" del backend (`row.style === 1` en el legado — total/resumen). */
  protected destacada(fila: Record<string, unknown>): boolean {
    return fila['style'] === 1;
  }
}
