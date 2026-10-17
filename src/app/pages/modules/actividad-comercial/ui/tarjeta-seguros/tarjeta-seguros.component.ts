import { Component, computed, input, output } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideShield } from '@ng-icons/lucide';
import { MeterGroupModule } from 'primeng/metergroup';
import type { SegurosAsesor } from '../../models/actividad-comercial.model';
import { formatearValor } from '../../utils/actividad-comercial.util';
import { KpiPieComponent } from '../kpi-pie/kpi-pie.component';
import { TarjetaDominioComponent } from '../tarjeta-dominio/tarjeta-dominio.component';

/** Seguros: pólizas contra su meta, partidas por tipo. `datos` nulo = la carga de seguros aún no corrió (pendiente, no cero). */
@Component({
  selector: 'app-tarjeta-seguros',
  standalone: true,
  imports: [TarjetaDominioComponent, KpiPieComponent, MeterGroupModule],
  viewProviders: [provideIcons({ lucideShield })],
  templateUrl: './tarjeta-seguros.component.html',
  styleUrl: './tarjeta-seguros.component.css',
})
export class TarjetaSegurosComponent {
  readonly datos = input.required<SegurosAsesor | null>();
  readonly verDetalle = output<void>();

  /** Un segmento por tipo de seguro; con `max` = meta de pólizas (o el total sin meta), el relleno es el avance. */
  protected readonly tipos = computed(() =>
    (this.datos()?.tipos ?? []).map((tipo) => ({ label: tipo.nombre, value: tipo.polizas, color: tipo.color })),
  );

  protected readonly resumen = computed(() => {
    const p = this.datos()?.polizas;
    if (!p) return '';
    return p.meta === null ? `${formatearValor(p.valor, p.formato)} · sin meta` : `${formatearValor(p.valor, p.formato)} / ${formatearValor(p.meta, p.formato)} meta`;
  });

  /** Escala de la barra: la meta; sin meta, el total, para que el reparto por tipo siga leyéndose. */
  protected readonly escala = computed(() => {
    const p = this.datos()?.polizas;
    return p ? Math.max(p.meta ?? p.valor, 1) : 1;
  });
}
