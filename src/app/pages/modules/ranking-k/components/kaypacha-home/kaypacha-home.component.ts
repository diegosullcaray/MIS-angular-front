import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { KaypachaService } from '../../services/kaypacha.service';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';

/** Vista principal de redirección del ranking Kaypacha. */
@Component({
  selector: 'app-kaypacha-home',
  standalone: true,
  imports: [ListSkeletonComponent, InlineErrorComponent, EmptyStateComponent, WindowPanelComponent],
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
