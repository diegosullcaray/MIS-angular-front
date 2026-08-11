import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { LoadingService, type LoadingState } from '../../services/loading.service';

/** Spinner de pantalla completa — cubre cualquier contenido (incluidos diálogos) mientras `LoadingService.isLoading` es `true`. */
@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [ProgressSpinnerModule],
  templateUrl:
   './loading-overlay.component.html',
  styleUrl: './loading-overlay.component.css',
})
export class LoadingOverlayComponent {
  private readonly loading = inject(LoadingService);

  protected readonly estado = toSignal(this.loading.loading$, {
    initialValue: { isLoading: false, requestCount: 0 } as LoadingState,
  });
}
