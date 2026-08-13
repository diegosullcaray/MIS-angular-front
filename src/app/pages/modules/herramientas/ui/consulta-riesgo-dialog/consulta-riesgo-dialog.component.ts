import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { BaseNegativaService } from '../../services/base-negativa.service';
import type { BaseNegativaBusquedaFila } from '../../models/base-negativa.model';
import { DataTableComponent } from '../../../../../shared/ui/data-table/data-table.component';
import { DataTableCellDirective } from '../../../../../shared/ui/data-table/data-table-cell.directive';
import type { DataTableColumn } from '../../../../../shared/ui/data-table/data-table.model';

const COLUMNAS: DataTableColumn[] = [
  { field: 'HCTACLI', header: 'Cuenta Cliente', filterType: 'text' },
  { field: 'HDESCLI', header: 'Nombre Cliente', filterType: 'text' },
  { field: 'FECHA', header: 'Fecha Reg.', align: 'center', filterType: 'date' },
  { field: 'TIPO', header: 'Tipo Cartera', align: 'center', filterType: 'text' },
  { field: 'accion', header: '', align: 'center', width: '8rem', sortable: false },
];

/**
 * Diálogo de "Consulta Base Negativa" — lista todos los clientes de la base
 * de riesgos con `app-data-table` (búsqueda y filtros por columna en el
 * cliente), igual que `destino-credito.component`, en vez de la búsqueda en
 * vivo contra el servidor que tenía antes. `BaseNegativaService.buscar('')`
 * ya devuelve el listado completo (el legado usa el mismo endpoint para
 * búsqueda y detalle).
 */
@Component({
  selector: 'app-consulta-riesgo-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, TooltipModule, DataTableComponent, DataTableCellDirective],
  templateUrl: './consulta-riesgo-dialog.component.html',
  styleUrl: './consulta-riesgo-dialog.component.css',
})
export class ConsultaRiesgoDialogComponent {
  private readonly service = inject(BaseNegativaService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() clienteSeleccionado = new EventEmitter<BaseNegativaBusquedaFila>();

  protected readonly columnas = COLUMNAS;
  protected readonly resultados = signal<BaseNegativaBusquedaFila[]>([]);
  protected readonly cargando = signal(false);

  constructor() {
    this.cargarClientes();
  }

  protected cargarClientes(): void {
    this.cargando.set(true);
    this.service.buscar('').subscribe({
      next: (filas) => {
        this.resultados.set(filas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected seleccionar(item: BaseNegativaBusquedaFila): void {
    this.clienteSeleccionado.emit(item);
    this.cerrar();
  }

  protected cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
