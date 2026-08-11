import { Component, input, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { DetalleVariableContentComponent } from '../detalle-variable-content/detalle-variable-content.component';

type ReqDetalle = 'getDetail' | 'getTasa' | 'getProd' | 'getRetencion';

/**
 * Diálogo de detalle de variable (drill-down) — migrado de
 * `DetalleComponent`/`DetalleDialogComponent`/`DetalleBaseComponent`
 * (legado STG, `pages/modules/incentivos3/detalle`). Solo pone el chrome del
 * `p-dialog` (título/ícono/cierre) — el contenido y su lógica de drill-down
 * viven en `DetalleVariableContentComponent`, compartido con la fila
 * expandida de `TablaVariablesComponent`.
 */
@Component({
  selector: 'app-detalle-variable-dialog',
  standalone: true,
  imports: [DialogModule, DetalleVariableContentComponent],
  templateUrl: './detalle-variable-dialog.component.html',
  styleUrl: './detalle-variable-dialog.component.css',
})
export class DetalleVariableDialogComponent {
  readonly visible = input(false);
  readonly titulo = input('');
  readonly icono = input('pi pi-info-circle');
  readonly req = input<ReqDetalle>('getDetail');
  readonly codVar = input(0);
  readonly mostrarTarjetas = input(false);

  readonly visibleChange = output<boolean>();

  protected cerrar(): void {
    this.visibleChange.emit(false);
  }
}
