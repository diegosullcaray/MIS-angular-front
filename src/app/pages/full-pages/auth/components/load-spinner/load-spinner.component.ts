import { Component, input } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

/**
 * Pantalla de transición tras un login exitoso, mientras se descarga y
 * arranca el shell del Host (`/app/dashboard`).
 */
@Component({
  selector: 'app-load-spinner',
  imports: [ProgressSpinnerModule],
  templateUrl: './load-spinner.component.html',
  styleUrl: './load-spinner.component.css',
})
export class LoadSpinnerComponent {
  readonly mensaje = input('Preparando tu espacio de trabajo…');
}
