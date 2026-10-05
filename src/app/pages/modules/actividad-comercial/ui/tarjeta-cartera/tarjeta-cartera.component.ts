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
  templateUrl: './tarjeta-cartera.component.html',
  styleUrl: './tarjeta-cartera.component.css',
})
export class TarjetaCarteraComponent {
  readonly datos = input.required<CarteraAsesor>();
  readonly verDetalle = output<void>();
}
