import { Component, model, output, signal, inject } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { KaypachaDashboardService } from '../../services/kaypacha-dashboard.service';
import type { KaypachaColaboradorItem } from '../../models/kaypacha-colaborador.model';
import { DataTableComponent } from '../../../../../shared/ui/data-table/data-table.component';
import { DataTableCellDirective } from '../../../../../shared/ui/data-table/data-table-cell.directive';
import type { DataTableColumn } from '../../../../../shared/ui/data-table/data-table.model';

const COLUMNAS: DataTableColumn[] = [
  { field: 'cod_bt', header: 'Código BT', width: '7rem', filterType: 'text' },
  { field: 'des_col', header: 'Nombre del colaborador', width: '15rem', filterType: 'text' },
  { field: 'HCOLCAR', header: 'Cargo', width: '12rem', filterType: 'text' },
  { field: 'RCODCOL', header: 'Tipo', align: 'center', width: '7rem', filterType: 'text' },
  {
    field: 'num_doc',
    header: 'Documento',
    width: '8rem',
    filterType: 'text',
    mobileVisible: false,
  },
];

/** Diálogo modal para buscar y seleccionar colaboradores. */
@Component({
  selector: 'app-buscador-colaborador-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, TagModule, DataTableComponent, DataTableCellDirective],
  templateUrl: './buscador-colaborador-dialog.component.html',
  styleUrl: './buscador-colaborador-dialog.component.css',
})
export class BuscadorColaboradorDialogComponent {
  protected readonly service = inject(KaypachaDashboardService);

  readonly visible = model(false);
  readonly colaboradorSeleccionado = output<KaypachaColaboradorItem>();

  protected readonly itemSeleccionado = signal<KaypachaColaboradorItem | null>(null);
  protected readonly columnas = COLUMNAS;

  protected seleccionarYCerrar(): void {
    const item = this.itemSeleccionado();
    if (item) {
      this.colaboradorSeleccionado.emit(item);
      this.cerrar();
    }
  }

  protected cerrar(): void {
    this.visible.set(false);
    this.itemSeleccionado.set(null);
  }
}
