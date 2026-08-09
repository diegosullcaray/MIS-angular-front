import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import type { SectoristaItem } from '../../models';

/**
 * Diálogo de selección de colaborador ("sectorista") — reconstrucción del
 * `SecPickerDialog2` legado (servicio compartido de otro paquete de STG, no
 * incluido en el volcado de referencia de `docs/07-modulos/analista`), con
 * el mismo patrón de tabla + buscador que `BuscadorColaboradorDialogComponent`
 * de Kaypacha (`pages/modules/kaypacha`).
 */
@Component({
  selector: 'app-selector-sectorista-dialog',
  standalone: true,
  imports: [FormsModule, DialogModule, TableModule, ButtonModule, IconFieldModule, InputIconModule, InputTextModule],
  templateUrl: './selector-sectorista-dialog.component.html',
  styleUrl: './selector-sectorista-dialog.component.css',
})
export class SelectorSectoristaDialogComponent {
  readonly visible = input(false);
  readonly sectoristas = input<SectoristaItem[]>([]);
  readonly cargando = input(false);

  readonly visibleChange = output<boolean>();
  readonly sectoristaSeleccionado = output<SectoristaItem>();

  protected readonly filtro = signal('');
  protected readonly seleccionado = signal<SectoristaItem | null>(null);

  protected readonly filtrados = computed(() => {
    const termino = this.filtro().toLowerCase().trim();
    if (!termino) return this.sectoristas();
    return this.sectoristas().filter(
      (s) => s.des_sec?.toLowerCase().includes(termino) || s.cod_sec?.toLowerCase().includes(termino)
    );
  });

  protected onSeleccionarFila(item: SectoristaItem | SectoristaItem[] | undefined): void {
    if (item && !Array.isArray(item)) this.seleccionado.set(item);
  }

  protected confirmar(): void {
    const item = this.seleccionado();
    if (!item) return;

    this.sectoristaSeleccionado.emit(item);
    this.cerrar();
  }

  protected cerrar(): void {
    this.visibleChange.emit(false);
    this.filtro.set('');
    this.seleccionado.set(null);
  }
}
