import { Component, computed, input, output } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideCircleAlert } from '@ng-icons/lucide';
import type { MoraAsesor, ProgresoMeta, RecuperadoAsesor } from '../../models/actividad-comercial.model';
import { formatearValor, porcentaje } from '../../utils/actividad-comercial.util';
import { BarraMetaComponent } from '../barra-meta/barra-meta.component';
import { KpiPieComponent } from '../kpi-pie/kpi-pie.component';
import { TarjetaDominioComponent } from '../tarjeta-dominio/tarjeta-dominio.component';

/** Recuperaciones y mora: lo recuperado contra lo asignado, efectividad por tramo y el estado de la mora. */
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

  protected readonly efectividades = computed(() =>
    this.datos().efectividades.map((progreso) => ({ progreso, cumple: progreso.valor >= progreso.meta })),
  );

  protected pctRecuperado(r: RecuperadoAsesor): string {
    return formatearValor(porcentaje(r.recuperado, r.total), 'porcentaje');
  }

  protected entero(valor: number, r: RecuperadoAsesor): string {
    return formatearValor(valor, r.formato);
  }

  protected texto(valor: number, p: ProgresoMeta): string {
    return formatearValor(valor, p.formato);
  }
}
