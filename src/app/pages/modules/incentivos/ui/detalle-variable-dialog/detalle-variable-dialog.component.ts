import { Component, input, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { DetalleVariableContentComponent } from '../detalle-variable-content/detalle-variable-content.component';
import type { ReqDetalleVariable } from '../../models/incentivos-detalle.model';

/** Diálogo modal de detalle de variable para Incentivos. */
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
  readonly req = input<ReqDetalleVariable>('getDetail');
  readonly codVar = input(0);
  readonly mostrarTarjetas = input(false);

  readonly visibleChange = output<boolean>();

  protected cerrar(): void {
    this.visibleChange.emit(false);
  }
}
