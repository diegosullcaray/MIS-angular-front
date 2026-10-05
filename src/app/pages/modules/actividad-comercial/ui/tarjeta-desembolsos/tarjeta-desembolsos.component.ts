import { Component, computed, input, output } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideFlag } from '@ng-icons/lucide';
import type { DesembolsosAsesor, ProgresoMeta } from '../../models/actividad-comercial.model';
import { formatearValor, porcentaje } from '../../utils/actividad-comercial.util';
import { BarraMetaComponent } from '../barra-meta/barra-meta.component';
import { KpiPieComponent } from '../kpi-pie/kpi-pie.component';
import { TarjetaDominioComponent } from '../tarjeta-dominio/tarjeta-dominio.component';

/** Desembolsos: avance de operaciones y monto contra su meta y contra los días hábiles transcurridos. */
@Component({
  selector: 'app-tarjeta-desembolsos',
  standalone: true,
  imports: [TarjetaDominioComponent, BarraMetaComponent, KpiPieComponent],
  viewProviders: [provideIcons({ lucideFlag })],
  templateUrl: './tarjeta-desembolsos.component.html',
  styleUrl: './tarjeta-desembolsos.component.css',
})
export class TarjetaDesembolsosComponent {
  readonly datos = input.required<DesembolsosAsesor>();
  readonly verDetalle = output<void>();

  protected readonly barras = computed(() => [
    { progreso: this.datos().operaciones, pct: porcentaje(this.datos().operaciones.valor, this.datos().operaciones.meta), color: 'var(--mis-warning)' },
    { progreso: this.datos().monto, pct: porcentaje(this.datos().monto.valor, this.datos().monto.meta), color: 'var(--mis-primary)' },
  ]);

  protected valor(p: ProgresoMeta): string {
    return formatearValor(p.valor, p.formato);
  }

  protected meta(p: ProgresoMeta): string {
    return formatearValor(p.meta, p.formato);
  }
}
