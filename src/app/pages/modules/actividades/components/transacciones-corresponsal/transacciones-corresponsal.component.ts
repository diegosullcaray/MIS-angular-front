import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ActividadesService } from '../../services/actividades.service';
import type { TransaccionCorresponsalItem } from '../../models/actividades.model';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { inputValue } from '../../../../../shared/utils/dom.util';

@Component({
  selector: 'app-transacciones-corresponsal',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    TooltipModule,
    ListSkeletonComponent,
    InlineErrorComponent,
    WindowPanelComponent,
  ],
  templateUrl: './transacciones-corresponsal.component.html',
  styleUrl: './transacciones-corresponsal.component.css',
})
export class TransaccionesCorresponsalComponent implements OnInit {
  private readonly service = inject(ActividadesService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<TransaccionCorresponsalItem[]>([]);
  readonly globalFilter = signal('');

  readonly filteredData = computed(() => {
    const q = this.globalFilter().toLowerCase().trim();
    if (!q) return this.data();
    return this.data().filter(
      (x) =>
        x.HAPENOMB?.toLowerCase().includes(q) ||
        x.HNUMDOC?.toLowerCase().includes(q) ||
        x.HCONSRCC?.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  protected cargarDatos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getRegResultadosListProsp().subscribe({
      next: (res) => {
        const body = res.body as { resultado?: { result?: TransaccionCorresponsalItem[] } } | null;
        const list = body?.resultado?.result || [];
        this.data.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('No se pudo cargar la información de Transacciones.');
        this.loading.set(false);
      },
    });
  }

  protected onSearchInput(event: Event): void {
    this.globalFilter.set(inputValue(event));
  }
}
