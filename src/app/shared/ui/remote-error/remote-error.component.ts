import { Component, input, output } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideAlertTriangle, lucideRefreshCw, lucideWifi } from '@ng-icons/lucide';

/**
 * Mensaje de error elegante cuando un Remote no está disponible en la red.
 * Cumple con criterio de aceptación CA-04.
 */
@Component({
  selector: 'app-remote-error',
  standalone: true,
  imports: [NgIconComponent],
  viewProviders: [provideIcons({ lucideAlertTriangle, lucideRefreshCw, lucideWifi })],
  templateUrl: './remote-error.component.html',
  styleUrl: './remote-error.component.css',
})
export class RemoteErrorComponent {
  readonly subsistema = input.required<string>();
  readonly motivo     = input<string>();
  readonly reintentar = output<void>();
}
