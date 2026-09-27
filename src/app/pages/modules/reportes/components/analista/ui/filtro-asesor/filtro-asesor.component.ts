import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import type { AsesorSec } from '../../models/asesor-sec.model';

/** Filtro "Asesor" de los reportes de Analista: buscador, o el nombre fijo si el usuario es el asesor. */
@Component({
  selector: 'app-filtro-asesor',
  standalone: true,
  imports: [FormsModule, SelectModule],
  template: `
    <div class="flex flex-col gap-1">
      <span class="text-[11px] font-bold text-[var(--mis-text-secondary)] uppercase tracking-wider">Asesor</span>
      @if (editable()) {
        <p-select
          appendTo="body"
          [options]="asesores()"
          [ngModel]="seleccionado()"
          (ngModelChange)="cambio.emit($event)"
          optionLabel="nombre"
          dataKey="dni"
          [filter]="true"
          filterBy="nombre"
          placeholder="Buscar asesor"
          styleClass="w-72 text-[11.5px]"
          ariaLabel="Asesor"
        />
      } @else {
        <span class="text-[11.5px] text-[var(--mis-text-secondary)]">{{ seleccionado()?.nombre }}</span>
      }
    </div>
  `,
})
export class FiltroAsesorComponent {
  readonly asesores = input<AsesorSec[]>([]);
  readonly seleccionado = input<AsesorSec | null>(null);
  /** `false` cuando el usuario es el propio asesor: no elige, ve su nombre. */
  readonly editable = input(true);
  readonly cambio = output<AsesorSec | null>();
}
