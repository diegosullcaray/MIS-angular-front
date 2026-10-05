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
  templateUrl: './tarjeta-seguros.component.html',
  styleUrl: './tarjeta-seguros.component.css',
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
