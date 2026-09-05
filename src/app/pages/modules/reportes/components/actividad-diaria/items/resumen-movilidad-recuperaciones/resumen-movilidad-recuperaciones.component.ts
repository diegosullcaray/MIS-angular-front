import { Component, inject, signal } from '@angular/core';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { EmptyStateComponent } from '../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';
import { ResumenMovilidadService } from '../../services/resumen-movilidad.service';

/**
 * "Resumen de Movilidad Recuperaciones" (`leg/com/rda/adm/res-mov-rec`) —
 * legado `RESNMOVR_01`, host `cra-v6`.
 *
 * **Sin selector de jerarquía, a propósito.** `cra-v6` arma los parámetros del
 * nodo y después los pisa enteros con los del usuario logueado
 * (`tip_cod: 2, cod_rel: num_doc`), así que el nivel elegido no cambiaba nada.
 * El reporte es siempre el del propio usuario y por eso carga solo.
 */
@Component({
  selector: 'app-resumen-movilidad-recuperaciones',
  standalone: true,
  imports: [TablaReporteComponent, EmptyStateComponent, WindowPanelComponent],
  templateUrl: './resumen-movilidad-recuperaciones.component.html',
})
export class ResumenMovilidadRecuperacionesComponent {
  private readonly servicio = inject(ResumenMovilidadService);
  private readonly toast = inject(ToastService);

  protected readonly cargando = signal(false);
  protected readonly tabla = signal<TablaReporteResultado>(TABLA_VACIA);
  /** Sin documento del usuario no hay consulta posible: la pantalla lo dice. */
  protected readonly sinDocumento = signal(false);

  constructor() {
    const documento = this.servicio.documentoUsuario();
    if (!documento) {
      this.sinDocumento.set(true);
      return;
    }

    this.cargando.set(true);
    this.servicio.recuperaciones(documento).subscribe({
      next: ({ tabla1 }) => {
        this.tabla.set(tabla1);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
