import { Component } from '@angular/core';

/**
 * Skeleton animado mientras carga un Remote (micro-frontend).
 * Muestra filas de bloques pulsantes que simulan el contenido esperado.
 */
@Component({
  selector: 'app-remote-skeleton',
  standalone: true,
  templateUrl: './remote-skeleton.component.html',
  styleUrl: './remote-skeleton.component.css',
})
export class RemoteSkeletonComponent {
  readonly rows = [1, 2, 3, 4, 5];
}
