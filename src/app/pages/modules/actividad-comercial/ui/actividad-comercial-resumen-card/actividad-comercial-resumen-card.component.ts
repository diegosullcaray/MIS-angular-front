import { Component, input } from '@angular/core';

/** Tarjeta métrica del módulo Actividad Comercial. Presentacional: no inyecta servicios. */
@Component({
  selector: 'app-actividad-comercial-resumen-card',
  standalone: true,
  templateUrl: './actividad-comercial-resumen-card.component.html',
})
export class ActividadComercialResumenCardComponent {
  readonly titulo = input.required<string>();
  readonly valor = input.required<string | number>();
  readonly detalle = input<string>();
}
