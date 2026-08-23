import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import type { OpcionFiltro } from '../../models/filtros.model';

/** Desplegable etiquetado de la franja de filtros — equivalente a un `filter` de `cra-map.ts` (`{ label, data, selected }`). */
@Component({
  selector: 'app-select-filtro',
  standalone: true,
  imports: [FormsModule, SelectModule],
  template: `
    <div class="flex flex-col gap-0.5">
      <span class="text-[9.5px] font-bold text-[var(--mis-text-secondary)] uppercase tracking-wider">{{ etiqueta() }}</span>
      <p-select
        [options]="opciones()"
        optionLabel="desc"
        optionValue="id"
        [(ngModel)]="valor"
        [styleClass]="'text-[11.5px] ' + ancho()"
        [ariaLabel]="etiqueta()"
      />
    </div>
  `,
})
export class SelectFiltroComponent<T extends string | number> {
  readonly etiqueta = input.required<string>();
  readonly opciones = input.required<OpcionFiltro<T>[]>();
  readonly ancho = input('w-44');
  readonly valor = model.required<T>();
}
