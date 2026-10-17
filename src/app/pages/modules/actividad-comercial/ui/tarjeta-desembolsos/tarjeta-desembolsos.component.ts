import { Component, computed, input, output } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideFlag } from '@ng-icons/lucide';
import type { DesembolsosAsesor } from '../../models/actividad-comercial.model';
import { formatearEntero, formatearValor, porcentaje } from '../../utils/actividad-comercial.util';
import { BarraMetaComponent } from '../barra-meta/barra-meta.component';
import { KpiPieComponent } from '../kpi-pie/kpi-pie.component';
import { TarjetaDominioComponent } from '../tarjeta-dominio/tarjeta-dominio.component';

/** Desembolsos: avance de operaciones contra su meta y los días hábiles transcurridos, y el monto del mes (su meta está diferida). */
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

  protected readonly operaciones = computed(() => {
    const p = this.datos().operaciones;
    return {
      progreso: p,
      conMeta: p.meta !== null && p.meta > 0,
      pct: porcentaje(p.valor, p.meta ?? 0),
      valor: p.etiquetaValor ?? formatearValor(p.valor, p.formato),
      meta: formatearValor(p.meta, p.formato),
    };
  });

  protected readonly monto = computed(() => formatearEntero(this.datos().monto));
}
