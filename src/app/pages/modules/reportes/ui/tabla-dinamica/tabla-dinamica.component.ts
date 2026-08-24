import { Component, computed, inject, input, output, LOCALE_ID } from '@angular/core';
import { formatNumber } from '@angular/common';
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
  private readonly locale = inject(LOCALE_ID);

  readonly columnas = input.required<ColumnaDinamica[]>();
  readonly filas = input.required<Record<string, unknown>[]>();
  readonly cargando = input(false);
  /** Pinta en verde/rojo las columnas de variación — legado `aplicarEstilos()` de `carterizacion-cap-com`, que lo aplica a toda clave que contenga `var`. */
  readonly colorearVariaciones = input(false);
  
  readonly seleccionable = input(false);
  readonly filaSeleccionada = output<Record<string, unknown>>();

  protected readonly encabezados = computed(() => aplanarEncabezados(this.columnas()));

  protected valor(fila: Record<string, unknown>, columna: ColumnaDinamica): unknown {
    const crudo = fila[columna.key];
    if (crudo == null || crudo === '') return crudo;

    const tipo = columna.format?.type;
    if (tipo !== 'integer' && tipo !== 'decimal') return crudo;

    const numero = Number(crudo);
    return Number.isNaN(numero) ? crudo : formatNumber(numero, this.locale, tipo === 'integer' ? '1.0-0' : '1.2-2');
  }

  /** Color de la celda cuando es una variación: verde si sube, rojo si baja. */
  protected color(fila: Record<string, unknown>, columna: ColumnaDinamica): string | null {
    if (!this.colorearVariaciones() || !columna.key.toLowerCase().includes('var')) return null;

    const numero = Number(fila[columna.key]);
    if (Number.isNaN(numero) || numero === 0) return null;
    return numero > 0 ? 'var(--mis-success)' : 'var(--mis-danger)';
  }

  /** Fila "destacada" del backend (`row.style === 1` en el legado — total/resumen). */
  protected destacada(fila: Record<string, unknown>): boolean {
    return fila['style'] === 1;
  }

  protected onClickFila(fila: Record<string, unknown>): void {
    if (this.seleccionable()) {
      this.filaSeleccionada.emit(fila);
    }
  }
}
