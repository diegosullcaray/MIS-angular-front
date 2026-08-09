import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import type { ColaboradorItem } from '../../models';

/**
 * Diálogo de selección de colaborador — reconstrucción del `SecPickerDialog2`
 * legado (servicio compartido de otro paquete de STG, no incluido en el
 * volcado de referencia de `docs/07-modulos/analista`), mismo patrón que
 * `SelectorSectoristaDialogComponent` de Categorización (copia independiente,
 * cada módulo self-contained).
 */
@Component({
  selector: 'app-selector-colaborador-dialog',
  standalone: true,
  imports: [FormsModule, DialogModule, TableModule, ButtonModule, IconFieldModule, InputIconModule, InputTextModule],
  templateUrl: './selector-colaborador-dialog.component.html',
  styleUrl: './selector-colaborador-dialog.component.css',
})
export class SelectorColaboradorDialogComponent {
  readonly visible = input(false);
  readonly colaboradores = input<ColaboradorItem[]>([]);
  readonly cargando = input(false);

  readonly visibleChange = output<boolean>();
  readonly colaboradorSeleccionado = output<ColaboradorItem>();

  protected readonly filtro = signal('');
  protected readonly seleccionado = signal<ColaboradorItem | null>(null);

  protected readonly filtrados = computed(() => {
    const termino = this.filtro().toLowerCase().trim();
    if (!termino) return this.colaboradores();
    return this.colaboradores().filter(
      (c) => c.des_sec?.toLowerCase().includes(termino) || c.cod_sec?.toLowerCase().includes(termino)
    );
  });

  protected onSeleccionarFila(item: ColaboradorItem | ColaboradorItem[] | undefined): void {
    if (item && !Array.isArray(item)) this.seleccionado.set(item);
  }

  protected confirmar(): void {
    const item = this.seleccionado();
    if (!item) return;

    this.colaboradorSeleccionado.emit(item);
    this.cerrar();
  }

  protected cerrar(): void {
    this.visibleChange.emit(false);
    this.filtro.set('');
    this.seleccionado.set(null);
  }
}
