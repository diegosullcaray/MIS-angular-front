import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideTrophy, lucideFilter } from '@ng-icons/lucide';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { RankingTableComponent } from '../../ui/ranking-table/ranking-table.component';
import { RankingFiltrosComponent } from '../../ui/ranking-filtros/ranking-filtros.component';
import { RankingInfoDialogComponent } from '../../ui/ranking-info-dialog/ranking-info-dialog.component';
import { KaypachaService } from '../../services/kaypacha.service';
import type { FilaDetalleRanking, GrupoRanking, RankingFiltros, RankingTableFila } from '../../models';

/** Duración de la transición "aplicando filtros" (solo UX — el filtrado en sí es síncrono). */
const DURACION_TRANSICION_FILTROS_MS = 350;

/**
 * Desglose del ranking de una categoría (`/app/ranking-k/categoria/:id`).
 *
 * El legado (`detallek.component.html`) no muestra una sola tabla grande:
 * agrupa las filas por `hdester` (territorio/zona) y renderiza una tarjeta
 * con su propia tabla por cada grupo, en una grilla — se replica ese mismo
 * diseño acá con `RankingTableComponent` (ui/).
 */
@Component({
  selector: 'app-categoria-detalle',
  standalone: true,
  imports: [NgIconComponent, ButtonModule, TooltipModule, ListSkeletonComponent, InlineErrorComponent, EmptyStateComponent, RankingTableComponent, RankingFiltrosComponent, RankingInfoDialogComponent],
  viewProviders: [provideIcons({ lucideTrophy, lucideFilter })],
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

  protected readonly mostrarFiltros = signal(false);
  protected readonly aplicandoFiltros = signal(false);
  protected readonly filtros = signal<RankingFiltros | null>(null);
  /** Cantidad de tarjetas-esqueleto a mostrar mientras `aplicandoFiltros` está activo (evita el salto de layout). */
  protected readonly gruposEsqueleto = signal(0);

  /** Lugares (`hdester`) disponibles en la data actual — opciones del filtro. */
  protected readonly lugaresDisponibles = computed(() => Array.from(new Set(this.filas().map((f) => f.hdester))).sort());

  protected readonly puntosMinDisponible = computed(() => {
    const valores = this.filas().map((f) => Number(f.TOTAL_MES));
    return valores.length ? Math.min(...valores) : 0;
  });

  protected readonly puntosMaxDisponible = computed(() => {
    const valores = this.filas().map((f) => Number(f.TOTAL_MES));
    return valores.length ? Math.max(...valores) : 100;
  });

  /** Determina si hay filtros activos que estén restringiendo los datos por encima de los valores por defecto. */
  protected readonly hayFiltrosActivos = computed(() => {
    const f = this.filtros();
    if (!f) return false;

    const usuarioModificado = f.usuario.trim().length > 0;
    const lugaresModificados = f.lugares.length > 0 && f.lugares.length < this.lugaresDisponibles().length;
    const puntosModificados = f.puntosMin > this.puntosMinDisponible() || f.puntosMax < this.puntosMaxDisponible();
    const limiteModificado = f.limitePosiciones !== 10;

    return usuarioModificado || lugaresModificados || puntosModificados || limiteModificado;
  });

  /** Filas agrupadas por `hdester` (ya filtradas), cada una lista para `RankingTableComponent`. */
  protected readonly grupos = computed<GrupoRanking[]>(() => {
    const filtros = this.filtros();
    const porHdester = new Map<string, RankingTableFila[]>();

    for (const fila of this.filas()) {
      if (filtros) {
        if (filtros.usuario && !fila.HCOLNOM.toLowerCase().includes(filtros.usuario.toLowerCase())) continue;
        if (filtros.lugares.length && !filtros.lugares.includes(fila.hdester)) continue;
        const puntos = Number(fila.TOTAL_MES);
        if (puntos < filtros.puntosMin || puntos > filtros.puntosMax) continue;
      }

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
    this.filtros.set(null);

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

  /** Helper de template: arreglo de longitud `n` para repetir la tarjeta-esqueleto con `@for`. */
  protected arrayDe(n: number): unknown[] {
    return Array.from({ length: n });
  }

  protected onAplicarFiltros(filtros: RankingFiltros): void {
    this.gruposEsqueleto.set(this.grupos().length || 1);
    this.aplicandoFiltros.set(true);
    this.filtros.set(filtros);
    setTimeout(() => this.aplicandoFiltros.set(false), DURACION_TRANSICION_FILTROS_MS);
  }
}
