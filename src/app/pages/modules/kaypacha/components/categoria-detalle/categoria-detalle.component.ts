import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideTrophy } from '@ng-icons/lucide';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { KaypachaService } from '../../services/kaypacha.service';
import type { FilaDetalleRanking } from '../../models/kaypacha.model';

/** Desglose del ranking de una categoría (`/admin/kaypacha/categoria/:id`). */
@Component({
  selector: 'app-categoria-detalle',
  standalone: true,
  imports: [RouterLink, NgIconComponent, ListSkeletonComponent, InlineErrorComponent, EmptyStateComponent],
  viewProviders: [provideIcons({ lucideArrowLeft, lucideTrophy })],
  templateUrl: './categoria-detalle.component.html',
  styleUrl: './categoria-detalle.component.css',
})
export class CategoriaDetalleComponent {
  private readonly kaypacha = inject(KaypachaService);

  /** `rdestip` de la categoría — route param `:id` (withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly categoria = computed(() => this.kaypacha.buscarCategoria(this.id()));
  protected readonly filas = signal<FilaDetalleRanking[]>([]);
  protected readonly columnas = computed(() => Object.keys(this.filas()[0] ?? {}));
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

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
      next: (filas) => {
        this.filas.set(filas);
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
