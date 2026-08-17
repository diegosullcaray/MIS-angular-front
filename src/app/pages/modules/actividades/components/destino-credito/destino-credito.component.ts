import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { ActividadesService } from '../../services/actividades.service';
import type { DestinoCreditoItem } from '../../models/actividades.model';
import { DestinoCreditoDialogComponent } from '../../ui/destino-credito-dialog/destino-credito-dialog.component';
import { DestinoCreditoInfoDialogComponent } from '../../ui/destino-credito-info-dialog/destino-credito-info-dialog.component';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { DataTableComponent } from '../../../../../shared/ui/data-table/data-table.component';
import { DataTableCellDirective } from '../../../../../shared/ui/data-table/data-table-cell.directive';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import type { DataTableColumn } from '../../../../../shared/ui/data-table/data-table.model';

const COLUMNAS: DataTableColumn[] = [
  { field: 'HCODSEC', header: 'Cod. Asesor', align: 'center', width: '7rem', filterType: 'text' },
  { field: 'HDESSEC', header: 'Nombre Asesor', filterType: 'text' },
  { field: 'HCTACLI', header: 'Cuenta Cli.', filterType: 'text' },
  { field: 'HDESCLI', header: 'Nombre Cliente', filterType: 'text', mobileVisible: false },
  { field: 'HCODOPE', header: 'Operación', align: 'center', filterType: 'text', mobileVisible: false },
  { field: 'HFECDES', header: 'Fec. Desembolso', align: 'center', filterType: 'date', mobileVisible: false },
  { field: 'HMONDES', header: 'Monto Desembolso', align: 'right', filterType: 'number', mobileVisible: false },
  { field: 'HFECVIS', header: 'Fecha Visita', align: 'center', filterType: 'date', mobileVisible: false },
  {
    field: 'HCUMPLDC',
    header: 'Cumple Destino',
    align: 'center',
    filterType: 'dropdown',
    dropdownOptions: [
      { label: 'Si', value: 'Si' },
      { label: 'No', value: 'No' },
    ],
  },
  { field: 'accion', header: 'Acción', align: 'center', width: '5rem', sortable: false },
];

@Component({
  selector: 'app-destino-credito',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    CardModule,
    TooltipModule,
    ListSkeletonComponent,
    InlineErrorComponent,
    DestinoCreditoDialogComponent,
    DestinoCreditoInfoDialogComponent,
    DataTableComponent,
    DataTableCellDirective,
    WindowPanelComponent,
  ],
  templateUrl: './destino-credito.component.html',
  styleUrl: './destino-credito.component.css',
})
export class DestinoCreditoComponent implements OnInit {
  private readonly actividadesService = inject(ActividadesService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly data = signal<DestinoCreditoItem[]>([]);

  readonly modalVisible = signal(false);
  readonly selectedItem = signal<DestinoCreditoItem | null>(null);

  protected readonly columnas = COLUMNAS;

  ngOnInit(): void {
    this.cargarDatos();
  }

  protected cargarDatos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.actividadesService.getRegResultadosDestCred().subscribe({
      next: (res) => {
        const body = res.body as { resultado?: { result?: DestinoCreditoItem[] } } | null;
        const list = body?.resultado?.result || [];
        this.data.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar Destino de Crédito:', err);
        this.error.set('No se pudo cargar la información de Destino de Crédito.');
        this.loading.set(false);
      },
    });
  }

  protected abrirEdicion(item: DestinoCreditoItem): void {
    this.selectedItem.set(item);
    this.modalVisible.set(true);
  }

  protected guardarEdicion(payload: { cod_ope: string; fec_vis: string; is_valid: string }): void {
    this.actividadesService.postRegResultadosDestCred(payload).subscribe({
      next: () => {
        this.data.update((items) =>
          items.map((it) => {
            if (it.HCODOPE === payload.cod_ope) {
              return {
                ...it,
                HFECVIS: payload.fec_vis,
                HCUMPLDC: payload.is_valid,
              };
            }
            return it;
          })
        );
      },
      error: (err) => {
        console.error('Error al guardar registro:', err);
      },
    });
  }
}
