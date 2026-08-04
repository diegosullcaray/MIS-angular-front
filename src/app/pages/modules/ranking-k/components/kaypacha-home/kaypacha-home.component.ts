import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideTrophy } from '@ng-icons/lucide';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { KaypachaService } from '../../services/kaypacha.service';

/**
 * Landing de Kaypacha (`/app/ranking-k`) — en cuanto las categorías cargan,
 * navega directo a la primera (ya no se le pide al usuario que "elija una
 * categoría"); esta vista solo se ve brevemente mientras carga, o si hay
 * error / no hay categorías.
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

    effect(() => {
      const primera = this.kaypacha.categorias()[0];
      if (primera) {
        this.router.navigate([this.kaypacha.ruta, 'categoria', primera.rdestip], { replaceUrl: true });
      }
    });
  }
}
