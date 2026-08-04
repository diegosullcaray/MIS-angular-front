import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideTrophy } from '@ng-icons/lucide';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { RankingTableComponent, type RankingTableFila } from '../../../../../shared/ui/ranking-table/ranking-table.component';
import { KaypachaService } from '../../services/kaypacha.service';
import type { FilaDetalleRanking } from '../../models/kaypacha.model';

/** Un grupo (`hdester` — territorio/zona) con su propia tabla, ver `ranking-table`. */
interface GrupoRanking {
  hdester: string;
  filas: RankingTableFila[];
}

/**
 * Desglose del ranking de una categoría (`/app/ranking-k/categoria/:id`).
 *
 * El legado (`detallek.component.html`) no muestra una sola tabla grande:
 * agrupa las filas por `hdester` (territorio/zona) y renderiza una tarjeta
 * con su propia tabla por cada grupo, en una grilla — se replica ese mismo
 * diseño acá con `RankingTableComponent` (shared/ui).
 */
@Component({
  selector: 'app-categoria-detalle',
  standalone: true,
  imports: [NgIconComponent, ListSkeletonComponent, InlineErrorComponent, EmptyStateComponent, RankingTableComponent],
  viewProviders: [provideIcons({ lucideTrophy })],
  templateUrl: './categoria-detalle.component.html',
  styleUrl: './categoria-detalle.component.css',
})
export class CategoriaDetalleComponent {
  private readonly kaypacha = inject(KaypachaService);

  /** `rdestip` de la categoría — route param `:id` (withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly categoria = computed(() => this.kaypacha.buscarCategoria(this.id()));
  protected readonly filas = signal<FilaDetalleRanking[]>([]);
  protected readonly fechaActualizacion = signal<string | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Filas agrupadas por `hdester`, cada una lista para `RankingTableComponent`. */
  protected readonly grupos = computed<GrupoRanking[]>(() => {
    const porHdester = new Map<string, RankingTableFila[]>();

    for (const fila of this.filas()) {
      const grupo = porHdester.get(fila.hdester) ?? [];
      grupo.push({ posicion: fila.ROWNUMBER, etiqueta: fila.HCOLNOM, valor: fila.TOTAL_MES });
      porHdester.set(fila.hdester, grupo);
    }

    return Array.from(porHdester.entries()).map(([hdester, filas]) => ({
      hdester,
      filas: filas.sort((a, b) => a.posicion - b.posicion),
    }));
  });

  constructor() {
    // Si se entra directo por URL (sin pasar por la lista), asegura que las
    // categorías estén cargadas para poder mostrar el nombre en el título.
    this.kaypacha.cargarCategorias();

    // Reacciona a cada cambio de :id (navegar entre categorías reutiliza la instancia).
    effect(() => {
      this.id();
      untracked(() => this.cargarDetalle());
    });
  }

  protected cargarDetalle(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.kaypacha.obtenerDetalle(this.id()).subscribe({
      next: ({ filas, fechaActualizacion }) => {
        this.filas.set(filas);
        this.fechaActualizacion.set(fechaActualizacion);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el detalle de la categoría:', err);
        this.error.set('No se pudo cargar el detalle de esta categoría.');
        this.cargando.set(false);
      },
    });
  }
}
