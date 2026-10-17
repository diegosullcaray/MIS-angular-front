import { Component, computed, input, output } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideSmartphone } from '@ng-icons/lucide';
import type { AnilloDigital, DigitalAsesor, SemaforoDigital } from '../../models/actividad-comercial.model';
import { SIN_DATO, formatearEntero, formatearValor, formatearVariacion } from '../../utils/actividad-comercial.util';
import { KpiPieComponent } from '../kpi-pie/kpi-pie.component';
import { TarjetaDominioComponent } from '../tarjeta-dominio/tarjeta-dominio.component';

/** Circunferencia del anillo (radio 40 del viewBox de 100). */
const CIRCUNFERENCIA = 2 * Math.PI * 40;

const COLOR_SEMAFORO: Record<SemaforoDigital, string> = {
  1: 'var(--mis-success)',
  0: 'var(--mis-warning)',
  [-1]: 'var(--mis-danger)',
};

/** Digital: enrolamiento y usabilidad (sobre enrolados y sobre cartera) como anillos, con la meta y su semáforo. */
@Component({
  selector: 'app-tarjeta-digital',
  standalone: true,
  imports: [TarjetaDominioComponent, KpiPieComponent],
  viewProviders: [provideIcons({ lucideSmartphone })],
  templateUrl: './tarjeta-digital.component.html',
  styleUrl: './tarjeta-digital.component.css',
})
export class TarjetaDigitalComponent {
  readonly datos = input.required<DigitalAsesor>();
  readonly verDetalle = output<void>();

  protected readonly anillos = computed(() => this.datos().anillos.map((a) => this.vistaAnillo(a)));

  private vistaAnillo(a: AnilloDigital) {
    const valor = formatearValor(a.fraccion * 100, 'porcentaje');
    const variacion = a.variacionPp === null ? SIN_DATO : formatearVariacion(a.variacionPp, 'pp');
    const chip =
      a.meta === undefined
        ? 'Sin meta'
        : `Meta ${formatearValor(a.meta * 100, 'porcentaje')} · ${Math.round((a.cumplimiento ?? 0) * 100)}%`;
    return {
      titulo: a.titulo,
      valor,
      conteo: `${formatearEntero(a.numerador)} de ${formatearEntero(a.denominador)}`,
      variacion,
      sube: (a.variacionPp ?? 0) > 0,
      baja: (a.variacionPp ?? 0) < 0,
      chip,
      color: a.semaforo === undefined ? 'var(--mis-primary)' : COLOR_SEMAFORO[a.semaforo],
      arco: `${Math.min(Math.max(a.fraccion, 0), 1) * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`,
      /** Giro de la marca de meta: la meta 0,205 cae al 20,5 % de la vuelta. */
      giroMeta: a.meta === undefined ? null : Math.min(Math.max(a.meta, 0), 1) * 360,
      descripcion: `${a.titulo} ${valor}: ${formatearEntero(a.numerador)} de ${formatearEntero(a.denominador)}. ${a.descripcion} Variación ${variacion}. ${chip}.`,
    };
  }
}
