import { Component, input, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import type { FilaLabelValor } from '../../models/comun.model';

/** Diálogo genérico de detalle "etiqueta/valor" — reutilizado por el detalle de cliente de Principal (`dashboard.cliente`) y el detalle de prospecto de Becas (fila ya en memoria, sin pedir nada al backend). */
@Component({
  selector: 'app-detalle-tabla-dialog',
  standalone: true,
  imports: [DialogModule, SkeletonModule],
  templateUrl: './detalle-tabla-dialog.component.html',
})
export class DetalleTablaDialogComponent {
  readonly visible = input(false);
  readonly titulo = input('Detalle');
  readonly filas = input<FilaLabelValor[]>([]);
  readonly cargando = input(false);

  readonly visibleChange = output<boolean>();

  protected cerrar(): void {
    this.visibleChange.emit(false);
  }
}
