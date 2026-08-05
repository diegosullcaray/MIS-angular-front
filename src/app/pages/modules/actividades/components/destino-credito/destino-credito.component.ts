import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { ActividadesService } from '../../services/actividades.service';
import type { DestinoCreditoItem } from '../../models/actividades.model';
import { DestinoCreditoDialogComponent } from './destino-credito-dialog/destino-credito-dialog.component';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';

@Component({
  selector: 'app-destino-credito',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    CardModule,
    TooltipModule,
    ListSkeletonComponent,
    InlineErrorComponent,
    DestinoCreditoDialogComponent,
  ],
  templateUrl: './destino-credito.component.html',
  styleUrl: './destino-credito.component.css',
})
export class DestinoCreditoComponent implements OnInit {
  private readonly actividadesService = inject(ActividadesService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly data = signal<DestinoCreditoItem[]>([]);
  readonly globalFilter = signal('');

  // Control del modal de edición
  readonly modalVisible = signal(false);
  readonly selectedItem = signal<DestinoCreditoItem | null>(null);

  // Datos filtrados para la tabla PrimeNG
  readonly filteredData = computed(() => {
    const q = this.globalFilter().toLowerCase().trim();
    if (!q) return this.data();
    return this.data().filter(
      (x) =>
        x.HDESSEC?.toLowerCase().includes(q) ||
        x.HDESCLI?.toLowerCase().includes(q) ||
        x.HCODOPE?.toLowerCase().includes(q) ||
        x.HCTACLI?.toLowerCase().includes(q) ||
        x.HCODSEC?.toLowerCase().includes(q)
    );
  });

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

  protected onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.globalFilter.set(val);
  }

  protected abrirEdicion(item: DestinoCreditoItem): void {
    this.selectedItem.set(item);
    this.modalVisible.set(true);
  }

  protected guardarEdicion(payload: { cod_ope: string; fec_vis: string; is_valid: string }): void {
    this.actividadesService.postRegResultadosDestCred(payload).subscribe({
      next: () => {
        // Actualiza el item localmente
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
