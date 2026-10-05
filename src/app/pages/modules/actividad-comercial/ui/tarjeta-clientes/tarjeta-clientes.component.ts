import { Component, computed, input, output } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideUsers } from '@ng-icons/lucide';
import type { ClientesAsesor } from '../../models/actividad-comercial.model';
import { avanceVariacion, formatearAvance, formatearDelta } from '../../utils/actividad-comercial.util';
import { BarraMetaComponent } from '../barra-meta/barra-meta.component';
import { KpiPieComponent } from '../kpi-pie/kpi-pie.component';
import { TarjetaDominioComponent } from '../tarjeta-dominio/tarjeta-dominio.component';

/** Clientes: stock de hoy y del cierre anterior, movimiento del mes y avance de la variación pedida. */
@Component({
  selector: 'app-tarjeta-clientes',
  standalone: true,
  imports: [TarjetaDominioComponent, BarraMetaComponent, KpiPieComponent],
  viewProviders: [provideIcons({ lucideUsers })],
  templateUrl: './tarjeta-clientes.component.html',
  styleUrl: './tarjeta-clientes.component.css',
})
export class TarjetaClientesComponent {
  readonly datos = input.required<ClientesAsesor>();
  readonly verDetalle = output<void>();

  protected readonly avance = computed(() => avanceVariacion(this.datos().crecimientoNeto, this.datos().metaVariacion));
  protected readonly avanceTexto = computed(() => formatearAvance(this.avance().avancePct));

  protected delta(valor: number): string {
    return formatearDelta(valor);
  }

  protected claseMovimiento(valor: number): string {
    return valor > 0 ? 'text-[var(--mis-success)]' : valor < 0 ? 'text-[var(--mis-danger)]' : 'text-[var(--mis-primary-text)]';
  }
}
