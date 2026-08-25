import { effect, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { ToastService } from '../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../utils/hier-selector-error.util';
import type { NodoConsulta } from '../../services/bloque-reporte.service';
import type { HierarquiaNodo } from '../../models/jerarquia.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../models/tabla-reporte.model';
import type { ReporteBloqueUnico } from '../../components/actividad-diaria/models/captaciones.model';

/**
 * Estado de un reporte de un solo bloque, para usar con `ReporteSimpleComponent`.
 *
 * La subclase solo aporta `consultar()`. Como se invoca dentro de un `effect`,
 * las señales de filtro que lea ahí quedan registradas como dependencia: al
 * cambiar un filtro se vuelve a consultar sin que el componente lo pida.
 */
export abstract class ReporteSimpleBase {
  protected readonly toast = inject(ToastService);

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly tabla = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected abstract consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico>;

  constructor() {
    effect(() => {
      const nodo = this.nivelActual();
      if (nodo) this.cargar(nodo);
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  private cargar(nodo: HierarquiaNodo): void {
    this.cargando.set(true);
    // Se pasa el nodo COMPLETO: los reportes paginados reenvían también
    // `lvl_hier`/`des_rel`/`lbl_hier`. Los demás no cambian, porque
    // `BloqueReporteService.regular()` recorta a `tip_cod`/`cod_rel`.
    this.consultar(nodo).subscribe({
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
