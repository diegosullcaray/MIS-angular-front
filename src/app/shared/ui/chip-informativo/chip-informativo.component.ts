import { Component, input } from '@angular/core';
import { TagModule } from 'primeng/tag';

/** Severidades de `p-tag` que tienen sentido en un chip informativo. */
export type SeveridadChip = 'info' | 'secondary' | 'success' | 'warn' | 'danger';

/**
 * Chip para las notas cortas que acompañan a una tabla (la unidad, "Expresado en PEN y %", o un
 * indicador de la pestaña), en vez de un texto suelto encima de ella. Se alinea a la izquierda para
 * no estirarse cuando el padre es una columna flex.
 */
@Component({
  selector: 'app-chip-informativo',
  standalone: true,
  imports: [TagModule],
  host: { class: 'self-start' },
  template: `<p-tag [value]="texto()" [severity]="severidad()" [icon]="icono()" styleClass="text-[11px] font-medium" />`,
})
export class ChipInformativoComponent {
  readonly texto = input.required<string>();
  /** `info` por defecto; los indicadores con semáforo pasan la de `severidadSemaforo()`. */
  readonly severidad = input<SeveridadChip>('info');
  readonly icono = input('pi pi-info-circle');
}
