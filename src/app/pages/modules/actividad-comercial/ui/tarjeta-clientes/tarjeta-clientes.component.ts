import { Component, computed, input, output } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideUsers } from '@ng-icons/lucide';
import type { ClientesAsesor } from '../../models/actividad-comercial.model';
import { SIN_DATO, avanceVariacion, formatearAvance, formatearDelta, formatearEntero } from '../../utils/actividad-comercial.util';
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

  protected readonly cierreAnterior = computed(() => {
    const v = this.datos().cierreAnterior;
    return v === null ? SIN_DATO : formatearEntero(v);
  });

  protected readonly crecimientoNeto = computed(() => {
    const v = this.datos().crecimientoNeto;
    return v === null ? SIN_DATO : formatearDelta(v);
  });

  /** Sin crecimiento neto o sin meta de variación no hay avance que dibujar. */
  protected readonly avance = computed(() => {
    const { crecimientoNeto, metaVariacion } = this.datos();
    return crecimientoNeto === null || metaVariacion === null || metaVariacion <= 0 ? null : avanceVariacion(crecimientoNeto, metaVariacion);
  });
  protected readonly avanceTexto = computed(() => formatearAvance(this.avance()?.avancePct ?? 0));
  protected readonly meta = computed(() => formatearDelta(this.datos().metaVariacion ?? 0));

  protected delta(valor: number): string {
    return formatearDelta(valor);
  }

  protected claseMovimiento(valor: number): string {
    return valor > 0 ? 'text-[var(--mis-success)]' : valor < 0 ? 'text-[var(--mis-danger)]' : 'text-[var(--mis-primary-text)]';
  }
}
