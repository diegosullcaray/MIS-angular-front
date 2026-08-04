import { Component, inject } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCircleCheck, lucideCircleX, lucideInfo, lucideAlertTriangle, lucideX } from '@ng-icons/lucide';
import { ToastService, type ToastSeverity } from '../../services/toast.service';

/**
 * Stack de toasts del Host — reemplaza a `<p-toast>` de PrimeNG. Se monta
 * una sola vez en la raíz (`app.ts`) y consume `ToastService.toasts`.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgIconComponent],
  viewProviders: [provideIcons({ lucideCircleCheck, lucideCircleX, lucideInfo, lucideAlertTriangle, lucideX })],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
})
export class ToastComponent {
  protected readonly toast = inject(ToastService);

  protected readonly icono: Record<ToastSeverity, string> = {
    success: 'lucideCircleCheck',
    error: 'lucideCircleX',
    info: 'lucideInfo',
    warn: 'lucideAlertTriangle',
  };

  protected readonly colorIcono: Record<ToastSeverity, string> = {
    success: 'var(--mis-success)',
    error: 'var(--mis-danger)',
    info: 'var(--mis-secondary)',
    warn: 'var(--mis-warning)',
  };

  protected readonly fondoBorde: Record<ToastSeverity, string> = {
    success: 'var(--mis-success-light)',
    error: 'var(--mis-danger-light)',
    info: 'var(--mis-secondary-light)',
    warn: 'var(--mis-warning-light)',
  };
}
