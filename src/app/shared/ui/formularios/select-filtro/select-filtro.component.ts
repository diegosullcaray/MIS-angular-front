import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import type { OpcionFiltro } from '../opcion-filtro.model';

/** Desplegable etiquetado de la franja de filtros — equivalente a un `filter` de `cra-map.ts` (`{ label, data, selected }`). */
@Component({
  selector: 'app-select-filtro',
  standalone: true,
  imports: [FormsModule, SelectModule, ButtonModule, TooltipModule],
  template: `
    <div class="flex flex-col gap-0.5">
      <span
        class="text-[11px] font-bold text-[var(--mis-text-secondary)] uppercase tracking-wider"
        >{{ etiqueta() }}</span
      >
      <div class="flex items-end gap-1.5">
        <p-select
          [options]="opciones()"
          optionLabel="desc"
          optionValue="id"
          [(ngModel)]="valor"
          [styleClass]="'text-[11.5px] ' + ancho()"
          [ariaLabel]="etiqueta()"
          appendTo="body"
          [filter]="conBuscador()"
          filterBy="desc"
          filterPlaceholder="Buscar…"
        />
        @if (mostrarLimpiar()) {
          <p-button
            label="Limpiar"
            icon="pi pi-refresh"
            severity="secondary"
            styleClass="text-[12px] font-medium justify-center"
            [attr.aria-label]="'Limpiar ' + etiqueta()"
            [pTooltip]="'Limpiar ' + etiqueta()"
            tooltipPosition="top"
            (onClick)="limpiar.emit()"
          />
        }
      </div>
    </div>
  `,
})
export class SelectFiltroComponent<T extends string | number> {
  readonly etiqueta = input.required<string>();
  readonly opciones = input.required<OpcionFiltro<T>[]>();
  readonly ancho = input('w-44');
  /** Buscador dentro del desplegable, para catálogos largos (asesores, agencias). */
  readonly conBuscador = input(false);
  readonly mostrarLimpiar = input(false);
  readonly limpiar = output<void>();
  readonly valor = model.required<T>();
}
