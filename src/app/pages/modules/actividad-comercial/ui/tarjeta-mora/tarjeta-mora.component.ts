import { Component, computed, input, output } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideCircleAlert } from '@ng-icons/lucide';
import type { MoraAsesor } from '../../models/actividad-comercial.model';
import { formatearEntero, formatearValor } from '../../utils/actividad-comercial.util';
import { BarraMetaComponent } from '../barra-meta/barra-meta.component';
import { KpiPieComponent } from '../kpi-pie/kpi-pie.component';
import { TarjetaDominioComponent } from '../tarjeta-dominio/tarjeta-dominio.component';

/** Recuperaciones y mora: lo recuperado contra lo programado, efectividad por tramo y el estado de la mora. */
@Component({
  selector: 'app-tarjeta-mora',
  standalone: true,
  imports: [TarjetaDominioComponent, BarraMetaComponent, KpiPieComponent],
  viewProviders: [provideIcons({ lucideCircleAlert })],
  templateUrl: './tarjeta-mora.component.html',
  styleUrl: './tarjeta-mora.component.css',
})
export class TarjetaMoraComponent {
  readonly datos = input.required<MoraAsesor>();
  readonly verDetalle = output<void>();

  protected readonly recuperaciones = computed(() =>
    this.datos().recuperaciones.map((r) => ({
      titulo: r.titulo,
      porcentaje: formatearValor(r.porcentaje, 'porcentaje'),
      recuperado: formatearEntero(r.recuperado),
      total: formatearEntero(r.total),
    })),
  );

  /** Sin meta o sin dato no hay semáforo: la barra queda en el tono neutro de la tarjeta. */
  protected readonly efectividades = computed(() =>
    this.datos().efectividades.map((e) => ({
      etiqueta: e.etiqueta,
      valor: formatearValor(e.valor, 'porcentaje'),
      meta: e.meta === null ? 'Sin meta' : `Meta: ${formatearValor(e.meta, 'porcentaje')}`,
      pct: e.valor ?? 0,
      marca: e.meta,
      color: e.valor !== null && e.meta !== null && e.valor >= e.meta ? 'var(--mis-success)' : 'var(--mis-warning)',
    })),
  );
}
