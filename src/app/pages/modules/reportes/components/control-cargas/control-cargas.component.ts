import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, startWith, switchMap } from 'rxjs';
import { TablaReporteComponent } from '../../ui/tabla-reporte/tabla-reporte.component';
import { ControlCargasService } from '../../services/control-cargas.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { TablaReporteResultado } from '../../models/tabla-reporte.model';

const TABLA_VACIA: TablaReporteResultado = { headers: [], body: [], additional: {} };
const INTERVALO_REFRESCO_MS = 30 * 1000;

/**
 * "Control de Cargas" — migrado de la ruta `leg/prd` (legado STG,
 * `reportes/legacy/control-cargas`, `cod_rep: 'RS_MON_CAR_01'`).
 *
 * Sin jerarquía ni filtros: monitor de estado de cargas que se refresca solo
 * cada 30s (`setInterval` en el legado) — acá con `interval()` +
 * `takeUntilDestroyed()` en vez de `ReplaySubject`/`ngOnDestroy` manual. El
 * mismo `cod_rep` sirve para ambas tablas, diferenciadas por `opt`
 * (`opt:2` = fuentes de producción, `opt:1` = procesos diarios).
 */
@Component({
  selector: 'app-control-cargas',
  standalone: true,
  imports: [TablaReporteComponent],
  templateUrl: './control-cargas.component.html',
  styleUrl: './control-cargas.component.css',
})
export class ControlCargasComponent {
  private readonly servicio = inject(ControlCargasService);
  private readonly toast = inject(ToastService);

  protected readonly cargando = signal(true);
  protected readonly actualizadoAl = signal(this.formatearFecha(new Date()));
  protected readonly tablaProduccion = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tablaProcesos = signal<TablaReporteResultado>(TABLA_VACIA);

  constructor() {
    interval(INTERVALO_REFRESCO_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.servicio.obtenerReporte()),
        takeUntilDestroyed()
      )
      .subscribe({
        next: ({ produccion, procesos }) => {
          this.tablaProduccion.set(produccion);
          this.tablaProcesos.set(procesos);
          this.actualizadoAl.set(this.formatearFecha(new Date()));
          this.cargando.set(false);
        },
        error: () => {
          this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
          this.cargando.set(false);
        },
      });
  }

  private formatearFecha(fecha: Date): string {
    const parte = (n: number) => String(n).padStart(2, '0');
    return (
      `${fecha.getFullYear()}-${parte(fecha.getMonth() + 1)}-${parte(fecha.getDate())} ` +
      `${parte(fecha.getHours())}:${parte(fecha.getMinutes())}:${parte(fecha.getSeconds())}`
    );
  }
}
