import { Component, computed, input, output } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideShield } from '@ng-icons/lucide';
import { MeterGroupModule } from 'primeng/metergroup';
import type { ProgresoMeta, SegurosAsesor } from '../../models/actividad-comercial.model';
import { formatearValor, porcentaje } from '../../utils/actividad-comercial.util';
import { BarraMetaComponent } from '../barra-meta/barra-meta.component';
import { KpiPieComponent } from '../kpi-pie/kpi-pie.component';
import { TarjetaDominioComponent } from '../tarjeta-dominio/tarjeta-dominio.component';

/** Seguros: ingresos y pólizas contra su meta, con las pólizas partidas por tipo. */
@Component({
  selector: 'app-tarjeta-seguros',
  standalone: true,
  imports: [TarjetaDominioComponent, BarraMetaComponent, KpiPieComponent, MeterGroupModule],
  viewProviders: [provideIcons({ lucideShield })],
  template: `
    <app-tarjeta-dominio titulo="Seguros" icono="lucideShield" (verDetalle)="verDetalle.emit()">
      <div class="flex w-full flex-col gap-0.5">
        <div class="flex justify-between text-xs">
          <span class="text-[var(--mis-text-primary)]">{{ datos().ingresos.etiqueta }}</span>
          <span class="font-semibold text-[var(--mis-text-secondary)]">{{ resumen(datos().ingresos) }}</span>
        </div>
        <app-barra-meta
          [pct]="pctIngresos()"
          color="color-mix(in srgb, var(--mis-brand-navy) 40%, white)"
          [alto]="9"
          [descripcion]="datos().ingresos.etiqueta + ': ' + resumen(datos().ingresos)"
        />
      </div>
      <div class="flex w-full flex-col gap-1">
        <div class="flex justify-between text-xs">
          <span class="text-[var(--mis-text-primary)]">{{ datos().polizas.etiqueta }}</span>
          <span class="font-semibold text-[var(--mis-text-secondary)]">{{ resumen(datos().polizas) }}</span>
        </div>
        <!-- El segmento de cada tipo y su leyenda los dibuja p-metergroup; la escala llega a la meta de pólizas. -->
        <p-metergroup
          [value]="tipos()"
          [max]="datos().polizas.meta"
          [attr.aria-label]="datos().polizas.etiqueta + ' por tipo'"
          style="--p-metergroup-meters-size: 9px; --p-metergroup-meters-background: var(--mis-panel-bg)"
        >
          <ng-template #label>
            <ul class="m-0 mt-1 grid w-full list-none grid-cols-3 gap-x-1.5 gap-y-1 rounded-lg border border-[var(--mis-border)] px-2 py-1.5 text-[11px]" style="background: var(--mis-tile-bg)">
              @for (tipo of datos().tipos; track tipo.nombre) {
                <li class="flex items-center gap-1 overflow-hidden">
                  <span class="h-1.5 w-1.5 shrink-0 rounded-full" [style.background]="tipo.color" aria-hidden="true"></span>
                  <span class="overflow-hidden text-ellipsis whitespace-nowrap text-[var(--mis-text-secondary)]">{{ tipo.nombre }}:</span>
                  <b class="text-[var(--mis-text-primary)]">{{ tipo.polizas }}</b>
                </li>
              }
            </ul>
          </ng-template>
        </p-metergroup>
      </div>
      <app-kpi-pie pie [kpis]="datos().kpis" />
    </app-tarjeta-dominio>
  `,
  styles: [':host { display: block; min-width: 0; }'],
})
export class TarjetaSegurosComponent {
  readonly datos = input.required<SegurosAsesor>();
  readonly verDetalle = output<void>();

  protected readonly pctIngresos = computed(() => porcentaje(this.datos().ingresos.valor, this.datos().ingresos.meta));

  /** Un segmento por tipo de seguro; con `max` = meta de pólizas, el relleno total es el avance. */
  protected readonly tipos = computed(() =>
    this.datos().tipos.map((tipo) => ({ label: tipo.nombre, value: tipo.polizas, color: tipo.color })),
  );

  protected resumen(p: ProgresoMeta): string {
    return `${formatearValor(p.valor, p.formato)} / ${formatearValor(p.meta, p.formato)} meta`;
  }
}
