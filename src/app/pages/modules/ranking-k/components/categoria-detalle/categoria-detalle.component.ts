import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { RankingTableComponent } from '../../ui/ranking-table/ranking-table.component';
import { RankingFiltrosComponent } from '../../ui/ranking-filtros/ranking-filtros.component';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { RankingInfoDialogComponent } from '../../ui/ranking-info-dialog/ranking-info-dialog.component';
import { KaypachaService } from '../../services/kaypacha.service';
import { RankingTourService } from '../../services/ranking-tour.service';
import { RedirectOverlayService } from '../../../../../shared/services/redirect-overlay.service';
import type { FilaDetalleRanking } from '../../models/categoria-ranking.model';
import type { GrupoRanking, RankingTableFila } from '../../models/ranking-table.model';
import type { RankingFiltros } from '../../models/ranking-filtros.model';

const DURACION_TRANSICION_FILTROS_MS = 350;

/** Vista de detalle de categoría de ranking Kaypacha. */
@Component({
  selector: 'app-categoria-detalle',
  standalone: true,
  imports: [
    ButtonModule,
    TooltipModule,
    ListSkeletonComponent,
    InlineErrorComponent,
    EmptyStateComponent,
    RankingTableComponent,
    RankingFiltrosComponent,
    RankingInfoDialogComponent,
    WindowPanelComponent,
  ],
  templateUrl: './categoria-detalle.component.html',
  styleUrl: './categoria-detalle.component.css',
})
export class CategoriaDetalleComponent {
  private readonly kaypacha = inject(KaypachaService);
  protected readonly tour = inject(RankingTourService);
  protected readonly redirect = inject(RedirectOverlayService);

  readonly id = input.required<string>();

  protected readonly categoria = computed(() => this.kaypacha.buscarCategoria(this.id()));
  protected readonly filas = signal<FilaDetalleRanking[]>([]);
  protected readonly fechaActualizacion = signal<string | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly mostrarFiltros = signal(false);
  protected readonly aplicandoFiltros = signal(false);
  protected readonly filtros = signal<RankingFiltros | null>(null);
  protected readonly gruposEsqueleto = signal(0);

  protected readonly lugaresDisponibles = computed(() =>
    Array.from(new Set(this.filas().map((f) => f.hdester))).sort()
  );

  private readonly rangoPuntos = computed(() => {
    const filas = this.filas();
    if (!filas.length) return { min: 0, max: 100 };
    let min = Infinity;
    let max = -Infinity;
    for (const f of filas) {
      const v = Number(f.TOTAL_MES);
      if (v < min) min = v;
      if (v > max) max = v;
    }
    return { min, max };
  });

  protected readonly puntosMinDisponible = computed(() => this.rangoPuntos().min);
  protected readonly puntosMaxDisponible = computed(() => this.rangoPuntos().max);

  protected readonly hayFiltrosActivos = computed(() => {
    const f = this.filtros();
    if (!f) return false;

    const usuarioModificado = f.usuario.trim().length > 0;
    const lugaresModificados = f.lugares.length > 0 && f.lugares.length < this.lugaresDisponibles().length;
    const puntosModificados = f.puntosMin > this.puntosMinDisponible() || f.puntosMax < this.puntosMaxDisponible();
    const limiteModificado = f.limitePosiciones !== 10;

    return usuarioModificado || lugaresModificados || puntosModificados || limiteModificado;
  });

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
    this.kaypacha.cargarCategorias();

    effect(() => {
      this.id();
      untracked(() => this.cargarDetalle());
    });
  }

  protected cargarDetalle(): void {
    const idStr = this.id().toLowerCase().trim();
    if (idStr.includes('imparable') || idStr.includes('jira')) {
      this.redirect.redirigir(this.id());
    }

    this.cargando.set(true);
    this.error.set(null);
    this.filtros.set(null);

    this.kaypacha.obtenerDetalle(this.id()).subscribe({
      next: ({ filas, fechaActualizacion }) => {
        this.filas.set(filas);
        this.fechaActualizacion.set(fechaActualizacion);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el detalle de esta categoría.');
        this.cargando.set(false);
      },
    });
  }

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
