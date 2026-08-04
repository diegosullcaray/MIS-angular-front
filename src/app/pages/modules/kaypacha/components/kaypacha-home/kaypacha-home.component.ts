import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideTrophy } from '@ng-icons/lucide';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { KaypachaService } from '../../services/kaypacha.service';
import type { CategoriaRanking } from '../../models/kaypacha.model';

/**
 * Landing de Kaypacha (`/admin/ranking-k`) — lista las categorías del ranking.
 * La navegación principal vive en el panel Col 2 del sidebar (sección
 * "Categoría"); esta vista es el resumen que se ve al entrar al sistema o
 * en pantallas donde el panel está colapsado.
 */
@Component({
  selector: 'app-kaypacha-home',
  standalone: true,
  imports: [NgIconComponent, ListSkeletonComponent, InlineErrorComponent, EmptyStateComponent],
  viewProviders: [provideIcons({ lucideTrophy })],
  templateUrl: './kaypacha-home.component.html',
  styleUrl: './kaypacha-home.component.css',
})
export class KaypachaHomeComponent {
  protected readonly kaypacha = inject(KaypachaService);
  private readonly router = inject(Router);

  constructor() {
    this.kaypacha.cargarCategorias();
  }

  protected abrirCategoria(categoria: CategoriaRanking): void {
    this.router.navigate(['/admin/ranking-k/categoria', categoria.rdestip]);
  }
}
