import { Component, input, output, signal } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import type { SectoristaItem } from '../../models/colaborador.model';
import { DataTableComponent } from '../../../../../shared/ui/data-table/data-table.component';
import type { DataTableColumn } from '../../../../../shared/ui/data-table/data-table.model';

const COLUMNAS: DataTableColumn[] = [
  { field: 'cod_sec', header: 'Código', width: '8rem', filterType: 'text' },
  { field: 'des_sec', header: 'Colaborador', width: '18rem', filterType: 'text' },
];

/** Diálogo de selección de colaborador ("sectorista") — reconstrucción del `SecPickerDialog2` legado (servicio compartido de otro paquete de STG, no incluido en el volcado de referencia de `docs/07-modulos/analista`), con el mismo patrón de tabla + buscador que `BuscadorColaboradorDialogComponent` de Kaypacha (`pages/modules/kaypacha`). */
@Component({
  selector: 'app-selector-sectorista-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, DataTableComponent],
  templateUrl: './selector-sectorista-dialog.component.html',
})
export class SelectorSectoristaDialogComponent {
  readonly visible = input(false);
  readonly sectoristas = input<SectoristaItem[]>([]);
  readonly cargando = input(false);

  readonly visibleChange = output<boolean>();
  readonly sectoristaSeleccionado = output<SectoristaItem>();

  protected readonly seleccionado = signal<SectoristaItem | null>(null);
  protected readonly columnas = COLUMNAS;

  protected confirmar(): void {
    const item = this.seleccionado();
    if (!item) return;

    this.sectoristaSeleccionado.emit(item);
    this.cerrar();
  }

  protected cerrar(): void {
    this.visibleChange.emit(false);
    this.seleccionado.set(null);
  }
}
