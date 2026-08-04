import { Component, computed, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';

/** Fila genérica de un ranking/leaderboard. */
export interface RankingTableFila {
  /** Posición dentro del grupo (1 = primer lugar). */
  posicion: number;
  etiqueta: string;
  valor: number;
}

const LIMITE_DEFECTO = 10;

/**
 * Tabla de ranking reutilizable — un grupo (ej. una zona/territorio) con su
 * propio encabezado y su propia tabla de posiciones, resaltando el primer
 * lugar. Migrado del patrón "una `stg-table2` por `hdester`" del sistema
 * legado (`ranking-k/detallek/detallek.component.html`): en vez de una sola
 * tabla gigante, cada grupo es una tarjeta separada — se instancia una por
 * grupo (ver `categoria-detalle.component.html`).
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
  /** Máximo de filas a mostrar (el legado no pagina — se limita al Top N). */
  readonly limite = input(LIMITE_DEFECTO);
  /** Muestra el esqueleto de carga en vez de la tabla real (carga inicial o transición al aplicar filtros). */
  readonly cargando = input(false);

  protected readonly filasVisibles = computed(() => this.filas().slice(0, this.limite()));
  protected readonly filasSkeleton = computed(() => Array.from({ length: Math.min(this.limite(), 5) }));

  /** Resalta el primer lugar, igual que el legado (`#A9EFFD`) — coerciona a número porque `posicion` puede llegar como string desde el JSON del backend. */
  protected esPrimerPuesto(fila: RankingTableFila): boolean {
    return Number(fila.posicion) === 1;
  }
}
