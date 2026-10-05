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
  template: `
    <app-tarjeta-dominio titulo="Recuperaciones y Mora" icono="lucideCircleAlert" [alerta]="true" (verDetalle)="verDetalle.emit()">
      <div class="grid w-full grid-cols-2 gap-2.5">
        @for (r of datos().recuperaciones; track r.titulo) {
          <div class="flex flex-col gap-1 rounded-[10px] border border-[var(--mis-tile-border)] px-3 py-2.5" style="background: var(--mis-tile-bg)">
            <span class="text-[9px] font-semibold uppercase tracking-wider text-[var(--mis-primary-text)]">{{ r.titulo }}</span>
            <div class="flex items-center justify-between gap-2">
              <div class="flex shrink-0 flex-col gap-0.5 text-[var(--mis-primary-text)]">
                <span class="text-sm font-semibold leading-tight">{{ pctRecuperado(r) }}</span>
                <span class="text-[10px]">recuperado</span>
              </div>
              <div class="flex min-w-0 flex-col gap-0.5 text-right">
                <span class="text-[26px] font-semibold leading-tight text-[var(--mis-text-primary)]">{{ entero(r.recuperado, r) }}</span>
                <span class="text-[10px] text-[var(--mis-text-secondary)]">de {{ entero(r.total, r) }}</span>
              </div>
            </div>
          </div>
        }
      </div>
      <div class="grid w-full grid-cols-2 gap-2.5">
        @for (e of efectividades(); track e.progreso.etiqueta) {
          <div class="flex min-w-0 flex-col gap-1">
            <span class="text-[11px] text-[var(--mis-text-secondary)]">{{ e.progreso.etiqueta }}</span>
            <div class="flex flex-wrap items-baseline justify-between gap-x-1.5 gap-y-0.5">
              <span class="text-sm font-semibold text-[var(--mis-text-primary)]">{{ texto(e.progreso.valor, e.progreso) }}</span>
              <span class="text-[10px] text-[var(--mis-text-secondary)]">Meta: {{ texto(e.progreso.meta, e.progreso) }}</span>
            </div>
            <app-barra-meta
              [pct]="e.progreso.valor"
              [color]="e.cumple ? 'var(--mis-success)' : 'var(--mis-warning)'"
              [marca]="e.progreso.meta"
              [alto]="8"
              [descripcion]="e.progreso.etiqueta + ': ' + texto(e.progreso.valor, e.progreso) + ' (meta ' + texto(e.progreso.meta, e.progreso) + ')'"
            />
          </div>
        }
      </div>
      <app-kpi-pie pie [kpis]="datos().kpis" />
    </app-tarjeta-dominio>
  `,
  styles: [':host { display: block; min-width: 0; }'],
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
