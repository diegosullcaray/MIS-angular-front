import { Component, computed, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { aplanarEncabezados } from '../../utils/tabla-dinamica.util';
import type { ColumnaDinamica } from '../../models/tabla-dinamica.model';

/**
 * Tabla del motor `table.regular` (columnas dinámicas) — reemplaza a
 * `stg-table2` del legado (`shared/components/stg-table2`). A diferencia de
 * `app-tabla-reporte` (motor "mixto", encabezados ya aplanados por el
 * backend), acá el backend puede enviar un árbol de columnas anidadas
 * (`subs`) que se aplana en el cliente con `aplanarEncabezados()`.
 *
 * No migra el buscador/paginador custom de la pestaña "Asesores" del legado
 * (`eventSearch`/`StgPaginatorComponent`): en el HTML legado ese código nunca
 * estaba conectado a ningún control visible, así que en producción esas
 * tablas siempre mostraban la lista completa sin buscar ni paginar — igual
 * que las demás pestañas.
 */
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
