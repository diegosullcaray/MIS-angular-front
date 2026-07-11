import { Component, input } from '@angular/core';

/**
 * Skeleton pulsante para tablas y listas de datos.
 * Simula filas de una tabla mientras cargan los datos.
 */
@Component({
  selector: 'app-list-skeleton',
  standalone: true,
  templateUrl: './list-skeleton.component.html',
  styleUrl: './list-skeleton.component.css',
})
export class ListSkeletonComponent {
  readonly rows = input<number[]>([1, 2, 3, 4, 5]);
  readonly cols = input<number[]>([1, 2, 3, 4, 5]);

  getCellWidth(index: number): string {
    const widths = ['80%', '60%', '70%', '50%', '90%'];
    return widths[index % widths.length];
  }
}
