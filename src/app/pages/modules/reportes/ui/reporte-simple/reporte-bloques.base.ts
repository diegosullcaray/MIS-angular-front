import { effect, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { ToastService } from '../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../utils/hier-selector-error.util';
import type { NodoConsulta } from '../../services/bloque-reporte.service';
import type { HierarquiaNodo } from '../../models/jerarquia.model';
import type { TablaReporteResultado } from '../../models/tabla-reporte.model';
import type { BloqueReporte } from './reporte-simple.component';

/**
 * Igual que `ReporteSimpleBase` pero para los reportes de varios bloques, que
 * el legado apila uno debajo del otro (`report-cra-v1p1`: un
 * `app-table-multiheader` por cada `id` de su entrada en `cra-map.ts`).
 *
 * La subclase aporta los títulos de cada bloque y la consulta; como
 * `consultar()` corre dentro de un `effect`, las señales de filtro que lea
 * quedan registradas y un cambio de filtro vuelve a consultar solo.
 */
export abstract class ReporteBloquesBase {
  protected readonly toast = inject(ToastService);

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly tablas = signal<TablaReporteResultado[]>([]);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  /** Título de cada bloque, en el mismo orden que devuelve `consultar()`. */
  protected abstract readonly titulos: readonly string[];

  protected abstract consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]>;

  /** Lo que espera el `[bloques]` de `app-reporte-simple`. */
  protected bloques(): BloqueReporte[] {
    return this.tablas().map((tabla, i) => ({ titulo: this.titulos[i], tabla }));
  }

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
    this.consultar({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
      next: (tablas) => {
        this.tablas.set(tablas);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
