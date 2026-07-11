import { Component, input, output } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideInbox } from '@ng-icons/lucide';

/**
 * Estado vacío para listas sin datos.
 * Muestra un ícono, título y descripción opcionales.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [NgIconComponent],
  viewProviders: [provideIcons({ lucideInbox })],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css',
})
export class EmptyStateComponent {
  readonly icono       = input<string>('lucideInbox');
  readonly titulo      = input<string>('Sin resultados');
  readonly descripcion = input<string>();
  readonly accionLabel = input<string>();

  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly accion = output<void>();

  onAccion(): void {
    this.accion.emit();
  }
}
