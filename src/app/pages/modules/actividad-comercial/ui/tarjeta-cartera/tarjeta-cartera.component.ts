import { Component, input, output } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideBriefcase } from '@ng-icons/lucide';
import type { CarteraAsesor } from '../../models/actividad-comercial.model';
import { ColumnasCarteraComponent } from '../columnas-cartera/columnas-cartera.component';
import { KpiPieComponent } from '../kpi-pie/kpi-pie.component';
import { TarjetaDominioComponent } from '../tarjeta-dominio/tarjeta-dominio.component';

/** Cartera: saldo vigente y operaciones, hoy contra el cierre anterior y la meta. */
@Component({
  selector: 'app-tarjeta-cartera',
  standalone: true,
  imports: [TarjetaDominioComponent, ColumnasCarteraComponent, KpiPieComponent],
  viewProviders: [provideIcons({ lucideBriefcase })],
  template: `
    <app-tarjeta-dominio titulo="Cartera" icono="lucideBriefcase" (verDetalle)="verDetalle.emit()">
      <div class="grid min-h-0 w-full flex-1 grid-cols-1 gap-[18px] sm:grid-cols-2">
        <app-columnas-cartera [datos]="datos().saldo" />
        <app-columnas-cartera [datos]="datos().operaciones" />
      </div>
      <app-kpi-pie pie [kpis]="datos().kpis" />
    </app-tarjeta-dominio>
  `,
  styles: [':host { display: block; min-width: 0; }'],
})
export class TarjetaCarteraComponent {
  readonly datos = input.required<CarteraAsesor>();
  readonly verDetalle = output<void>();
}
