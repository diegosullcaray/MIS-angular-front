import { Component, input, output } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideAlertCircle } from '@ng-icons/lucide';

/**
 * Error inline de API — se muestra dentro de la vista donde ocurrió el fallo.
 * No interrumpe el layout de la página.
 */
@Component({
  selector: 'app-inline-error',
  standalone: true,
  imports: [NgIconComponent],
  viewProviders: [provideIcons({ lucideAlertCircle })],
  templateUrl: './inline-error.component.html',
  styleUrl: './inline-error.component.css',
})
export class InlineErrorComponent {
  readonly titulo      = input<string>('Error al cargar datos');
  readonly detalle     = input<string>();
  readonly accionLabel = input<string>('Reintentar');
  readonly reintentar  = output<void>();
}
