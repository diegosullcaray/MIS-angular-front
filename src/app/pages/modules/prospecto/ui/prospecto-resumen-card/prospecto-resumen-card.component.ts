import { Component, input } from '@angular/core';

/** Tarjeta métrica del módulo Prospecto. Presentacional: no inyecta servicios. */
@Component({
  selector: 'app-prospecto-resumen-card',
  standalone: true,
  templateUrl: './prospecto-resumen-card.component.html',
})
export class ProspectoResumenCardComponent {
  readonly titulo = input.required<string>();
  readonly valor = input.required<string | number>();
  readonly detalle = input<string>();
}
