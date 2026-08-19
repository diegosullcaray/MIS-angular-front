import { Component, inject } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { LoadingService } from '../../services/loading.service';

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

  protected readonly estado = this.loading.estado;
}
