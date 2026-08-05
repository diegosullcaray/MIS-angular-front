import { Component, computed, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import type { RankingTableFila } from '../../models';

const LIMITE_DEFECTO = 10;

/**
 * Tabla de ranking reutilizable — un grupo (ej. una zona/territorio) con su
 * propio encabezado y su propia tabla de posiciones, resaltando el primer
 * lugar. Muestra un scrollbar para acceder a todas las filas manteniendo
 * una altura inicial visible de ~10 filas.
 */
@Component({
  selector: 'app-ranking-table',
  standalone: true,
  imports: [TableModule, TooltipModule, SkeletonModule],
  templateUrl: './ranking-table.component.html',
  styleUrl: './ranking-table.component.css',
})
export class RankingTableComponent {
  readonly titulo = input<string>('');
  readonly filas = input<RankingTableFila[]>([]);
  /** Encabezado de la columna de valor (ej. "Puntos", "Monto"). */
  readonly valorLabel = input('Puntos');
  /** Máximo de filas a mostrar (0 = mostrar todas las posiciones). */
  readonly limite = input(LIMITE_DEFECTO);
  /** Altura del scrollable de la tabla (por defecto 360px para ~10 filas, 520px para ~20 filas). */
  readonly scrollHeight = input('360px');
  /** Muestra el esqueleto de carga en vez de la tabla real. */
  readonly cargando = input(false);

  protected readonly filasVisibles = computed(() => {
    const lim = this.limite();
    return lim > 0 ? this.filas().slice(0, lim) : this.filas();
  });

  protected readonly filasSkeleton = computed(() => {
    const lim = this.limite();
    const cant = lim > 0 ? Math.min(lim, 10) : 10;
    return Array.from({ length: cant });
  });

  /** Resalta el primer lugar, igual que el legado (`#A9EFFD`). */
  protected esPrimerPuesto(fila: RankingTableFila): boolean {
    return Number(fila.posicion) === 1;
  }

  /** Formatea la posición a 2 dígitos cuando es menor a 10 (ej. 01, 02), igual que la imagen de referencia. */
  protected formatPosicion(pos: number | string): string {
    const num = Number(pos);
    if (isNaN(num)) return String(pos);
    return num < 10 ? `0${num}` : `${num}`;
  }
}
