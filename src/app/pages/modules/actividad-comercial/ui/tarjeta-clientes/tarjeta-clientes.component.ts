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
  template: `
    <app-tarjeta-dominio titulo="Clientes" icono="lucideUsers" (verDetalle)="verDetalle.emit()">
      <div class="grid min-h-0 w-full flex-1 grid-cols-[3fr_2fr] content-between gap-3.5">
        <div class="grid grid-cols-2 items-start gap-4">
          <div class="flex flex-col">
            <span class="text-xs font-semibold leading-4 text-[var(--mis-text-secondary)]">Hoy</span>
            <strong class="text-[42px] font-bold leading-[46px] tracking-tight text-[var(--mis-primary-text)]">{{ datos().hoy }}</strong>
          </div>
          <div class="flex flex-col">
            <span class="text-xs font-semibold leading-4 text-[var(--mis-text-secondary)]">Cierre Anterior</span>
            <strong class="text-[42px] font-bold leading-[46px] tracking-tight text-[var(--mis-primary-text)]">{{ datos().cierreAnterior }}</strong>
          </div>
        </div>
        <dl class="m-0 flex flex-col gap-[7px] border-l border-[var(--mis-border)] pl-3">
          <dt class="text-[10px] font-semibold leading-[14px] text-[var(--mis-text-secondary)]">Movimiento del mes</dt>
          @for (m of datos().movimientos; track m.etiqueta) {
            <div class="flex justify-between gap-1.5 text-[10px] leading-[14px] text-[var(--mis-text-secondary)]">
              <dd class="m-0">{{ m.etiqueta }}</dd>
              <dd class="m-0 text-[13px] font-semibold" [class]="claseMovimiento(m.valor)">{{ delta(m.valor) }}</dd>
            </div>
          }
          <div class="flex justify-between gap-1.5 border-t border-[var(--mis-border)] pt-1.5 text-[10px] leading-[14px] text-[var(--mis-text-primary)]">
            <dd class="m-0">Crecimiento neto</dd>
            <dd class="m-0 text-[13px] font-semibold text-[var(--mis-primary-text)]">{{ delta(datos().crecimientoNeto) }}</dd>
          </div>
        </dl>
        <div class="col-span-full flex flex-col gap-1">
          <div class="flex justify-between gap-2 text-[10px] leading-3 text-[var(--mis-text-secondary)]">
            <span>Avance: <b class="font-semibold">{{ delta(datos().crecimientoNeto) }} · {{ avanceTexto() }}</b></span>
            <span style="color: var(--mis-primary-text)">Meta de variación: <b class="font-semibold">{{ delta(datos().metaVariacion) }}</b></span>
          </div>
          <app-barra-meta
            [pct]="avance().avancePct"
            [alto]="7"
            [marca]="100"
            [descripcion]="'Avance de la variación de clientes: ' + avanceTexto()"
          />
          <span class="text-right text-[9px] leading-3" style="color: var(--mis-primary-text)">Faltan <b>{{ avance().faltan }} clientes</b></span>
        </div>
      </div>
      <app-kpi-pie pie [kpis]="datos().kpis" />
    </app-tarjeta-dominio>
  `,
  styles: [':host { display: block; min-width: 0; }'],
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
