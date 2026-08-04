import { Component, input } from '@angular/core';
import { TableModule } from 'primeng/table';

/** Fila genérica de un ranking/leaderboard. */
export interface RankingTableFila {
  /** Posición dentro del grupo (1 = primer lugar). */
  posicion: number;
  etiqueta: string;
  valor: number;
}

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
  imports: [TableModule],
  templateUrl: './ranking-table.component.html',
  styleUrl: './ranking-table.component.css',
})
export class RankingTableComponent {
  readonly titulo = input.required<string>();
  readonly filas = input.required<RankingTableFila[]>();
  /** Encabezado de la columna de valor (ej. "Puntos", "Monto"). */
  readonly valorLabel = input('Puntos');

  /** Resalta el primer lugar, igual que el legado (`#A9EFFD`) — coerciona a número porque `posicion` puede llegar como string desde el JSON del backend. */
  protected esPrimerPuesto(fila: RankingTableFila): boolean {
    return Number(fila.posicion) === 1;
  }
}
