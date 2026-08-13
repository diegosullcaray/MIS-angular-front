import { Component, model, output, signal, computed, inject } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { KaypachaDashboardService } from '../../services/kaypacha-dashboard.service';
import type { KaypachaColaboradorItem } from '../../models/kaypacha-colaborador.model';

/** Diálogo modal para buscar y seleccionar colaboradores. */
@Component({
  selector: 'app-buscador-colaborador-dialog',
  standalone: true,
  imports: [
    DialogModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
  ],
  templateUrl: './buscador-colaborador-dialog.component.html',
  styleUrl: './buscador-colaborador-dialog.component.css',
})
export class BuscadorColaboradorDialogComponent {
  protected readonly service = inject(KaypachaDashboardService);

  readonly visible = model(false);
  readonly colaboradorSeleccionado = output<KaypachaColaboradorItem>();

  protected readonly filtroTexto = signal('');
  protected readonly itemSeleccionado = signal<KaypachaColaboradorItem | null>(null);

  protected readonly colaboradoresFiltrados = computed(() => {
    const query = this.filtroTexto().toLowerCase().trim();
    const todos = this.service.colaboradores();
    if (!query) return todos;

    return todos.filter(
      (c) =>
        (c.des_col && c.des_col.toLowerCase().includes(query)) ||
        (c.HCOLCAR && c.HCOLCAR.toLowerCase().includes(query)) ||
        (c.RCODCOL && c.RCODCOL.toLowerCase().includes(query)) ||
        (c.cod_bt && c.cod_bt.toLowerCase().includes(query)) ||
        (c.num_doc && c.num_doc.toLowerCase().includes(query))
    );
  });

  protected onFilterInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.filtroTexto.set(val);
  }

  protected onRowSelect(item: unknown): void {
    if (item && !Array.isArray(item)) {
      this.itemSeleccionado.set(item as KaypachaColaboradorItem);
    }
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
    this.filtroTexto.set('');
    this.itemSeleccionado.set(null);
  }
}
