import { Component, model, output, signal, computed, inject } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { KaypachaDashboardService } from '../../services/kaypacha-dashboard.service';
import { DataTableComponent } from '../../../../../shared/ui/data-table/data-table.component';
import type { DataTableColumn } from '../../../../../shared/ui/data-table/data-table.model';
import type { KaypachaColaboradorItem } from '../../models/kaypacha-colaborador.model';

/** Diálogo modal para buscar y seleccionar colaboradores. */
@Component({
  selector: 'app-buscador-colaborador-dialog',
  standalone: true,
  imports: [
    DialogModule,
    ButtonModule,
    TagModule,
    DataTableComponent,
  ],
  templateUrl: './buscador-colaborador-dialog.component.html',
  styleUrl: './buscador-colaborador-dialog.component.css',
})
export class BuscadorColaboradorDialogComponent {
  protected readonly service = inject(KaypachaDashboardService);

  readonly visible = model(false);
  readonly colaboradorSeleccionado = output<KaypachaColaboradorItem>();

  protected readonly itemSeleccionado = signal<KaypachaColaboradorItem | null>(null);

  protected readonly columnas: DataTableColumn[] = [
    { field: 'cod_bt', header: 'Código BT', width: '8rem', filterType: 'text' },
    { field: 'des_col', header: 'Nombre Colaborador', filterType: 'text' },
    { field: 'HCOLCAR', header: 'Cargo', filterType: 'text' },
    { field: 'RCODCOL', header: 'Tipo', width: '7rem', align: 'center', filterType: 'text' },
  ];

  protected onRowSelect(item: KaypachaColaboradorItem | null): void {
    this.itemSeleccionado.set(item);
  }

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
