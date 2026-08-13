import { Component, computed, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import type { ColumnaReporte, FilaEncabezadoReporte, FilaReporte } from '../../models/tabla-reporte.model';

/**
 * Tabla genérica del motor de reportes "mixtos" — reemplaza a
 * `app-table-multiheader`/`TableMHService` del legado
 * (`reportes/legacy/support/components/table/table-multiheader`). Igual que
 * el legado, es 100% dirigida por los datos que devuelve el backend
 * (`encabezados`/`filas`) — no declara columnas fijas, porque cada reporte
 * (`cod_rep`) puede traer un set de columnas distinto.
 *
 * No migra paginación/orden/edición/fila de totales: `theme_tb1()` (el único
 * tema usado por los reportes migrados hasta ahora, ver `cra-map.ts`) los
 * tenía todos desactivados, y la fila de totales del legado estaba, de
 * hecho, comentada/muerta en el propio HTML (`table-multiheader.component.html`).
 * Tampoco migra los formatos `variation`/`ratio` ni celdas interactivas
 * (`button`/`checkbox`/`radio`, solo aplicables bajo `theme.edit === true`) —
 * agregar soporte cuando algún reporte migrado los necesite de verdad.
 */
@Component({
  selector: 'app-tabla-reporte',
  standalone: true,
  imports: [TableModule],
  templateUrl: './tabla-reporte.component.html',
  styleUrl: './tabla-reporte.component.css',
})
export class TablaReporteComponent {
  readonly encabezados = input.required<FilaEncabezadoReporte[]>();
  readonly filas = input.required<FilaReporte[]>();
  readonly cargando = input(false);

  /** Columnas "hoja" (con datos) de todas las filas de encabezado, en el orden que indica `isdata` — `setdisplayedData()` del legado. */
  protected readonly columnasDato = computed(() => {
    const todas = this.encabezados().flatMap((fila) => fila.columns);
    return todas.filter((c) => c.isdata != null).sort((a, b) => (a.isdata ?? 0) - (b.isdata ?? 0));
  });

  protected valor(fila: FilaReporte, columna: ColumnaReporte): unknown {
    return fila[columna.columnDef];
  }

  protected esSemaforo(columna: ColumnaReporte): boolean {
    return columna.format?.['type'] === 'traffic-light';
  }

  protected formatear(valor: unknown, columna: ColumnaReporte): string {
    if (valor === null || valor === undefined || valor === '') return '';
    switch (columna.format?.['type']) {
      case 'number':
        return typeof valor === 'number' ? new Intl.NumberFormat('es-PE').format(valor) : String(valor);
      case 'percent':
        return typeof valor === 'number'
          ? new Intl.NumberFormat('es-PE', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(valor)
          : String(valor);
      default:
        return String(valor);
    }
  }

  /**
   * Color del ícono de semáforo — el legado coloreaba un ícono de Material
   * según el valor de la celda con una regla que vivía en CSS externo (no
   * localizable en el volcado del código). Se asume la misma convención
   * semántica que ya usan otros semáforos de este Host
   * (`AvancesGridComponent.colorEstado()`/`PerfilCardComponent.claseIcono()`):
   * `1` = éxito, `2` = alerta, cualquier otro valor = neutro. Ajustar si el
   * backend confirma otra regla.
   */
  protected colorSemaforo(valor: unknown): string {
    if (valor === 1) return 'text-[var(--mis-success)]';
    if (valor === 2) return 'text-[var(--mis-warning)]';
    return 'text-[var(--mis-text-tertiary)]';
  }
}
