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
  template: `
    <app-tarjeta-dominio titulo="Desembolsos" icono="lucideFlag" (verDetalle)="verDetalle.emit()">
      @for (barra of barras(); track barra.progreso.etiqueta) {
        <div class="flex w-full flex-col gap-1">
          <div class="flex justify-between text-[13px]">
            <span class="text-[var(--mis-text-primary)]">{{ barra.progreso.etiqueta }}</span>
            <span class="font-semibold text-[var(--mis-text-secondary)]">Meta: {{ meta(barra.progreso) }}</span>
          </div>
          <app-barra-meta
            [pct]="barra.pct"
            [color]="barra.color"
            [marca]="barra.pct"
            [esperado]="datos().avanceEsperado"
            [etiquetaFlotante]="barra.progreso.etiquetaValor ?? valor(barra.progreso)"
            [descripcion]="barra.progreso.etiqueta + ': ' + valor(barra.progreso) + ' de ' + meta(barra.progreso)"
          />
        </div>
      }
      <div class="mt-0.5 flex items-center gap-3.5 text-[11px] text-[var(--mis-text-secondary)]">
        <span class="flex items-center gap-1"><span class="h-[11px] w-0.5 bg-[var(--mis-text-primary)]"></span>Avance actual</span>
        <span class="flex items-center gap-1">
          <svg width="8" height="8" viewBox="0 0 10 10" aria-hidden="true" style="fill: var(--mis-primary)"><polygon points="0,0 10,0 5,8" /></svg>
          {{ datos().etiquetaAvanceEsperado }}
        </span>
      </div>
      <app-kpi-pie pie [kpis]="datos().kpis" />
    </app-tarjeta-dominio>
  `,
  styles: [':host { display: block; min-width: 0; }'],
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
