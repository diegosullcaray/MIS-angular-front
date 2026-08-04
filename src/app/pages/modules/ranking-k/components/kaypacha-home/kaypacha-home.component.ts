import { Component, inject } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideTrophy } from '@ng-icons/lucide';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { KaypachaService } from '../../services/kaypacha.service';

/**
 * Landing de Kaypacha (`/app/ranking-k`) — la navegación por categoría vive
 * en el panel Col 2 del sidebar (sección "Categoría", ver
 * `sidebar.component.ts`); esta vista es solo el estado inicial al entrar
 * al sistema (o el feedback de carga/error de esas mismas categorías).
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

  constructor() {
    this.kaypacha.cargarCategorias();
  }
}
