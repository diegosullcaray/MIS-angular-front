import { Component, computed, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import type { RankingTableFila } from '../../models/ranking-table.model';

const LIMITE_DEFECTO = 10;

/** Tabla de posiciones por grupo de ranking. */
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
  readonly valorLabel = input('Puntos');
  readonly limite = input(LIMITE_DEFECTO);
  readonly scrollHeight = input('360px');
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

  protected esPrimerPuesto(fila: RankingTableFila): boolean {
    return Number(fila.posicion) === 1;
  }

  protected formatPosicion(pos: number | string): string {
    const num = Number(pos);
    if (isNaN(num)) return String(pos);
    return num < 10 ? `0${num}` : `${num}`;
  }
}
