import { effect, inject, signal } from '@angular/core';
import type { Observable, Subscription } from 'rxjs';
import { ToastService } from '../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../utils/hier-selector-error.util';
import type { NodoConsulta } from '../../services/bloque-reporte.service';
import type { HierarquiaNodo } from '../../models/jerarquia.model';
import { TABLA_PENDIENTE, type TablaReporteResultado } from '../../models/tabla-reporte.model';
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

  /**
   * Nota al pie de cada bloque, por índice — el `content.lower` del legado, que va por tabla.
   * La subclase la sobrescribe solo si alguno de sus bloques la tiene.
   */
  protected readonly notas: (string | undefined)[] = [];

  /** Lo que espera el `[bloques]` de `app-reporte-simple`. */
  protected bloques(): BloqueReporte[] {
    return this.tablas().map((tabla, i) => ({
      titulo: this.titulos[i],
      tabla,
      nota: this.notas[i],
      cargando: tabla === TABLA_PENDIENTE,
    }));
  }

  constructor() {
    /**
     * `onCleanup` cancela la petición en vuelo cada vez que el nodo cambia o el
     * componente se destruye — igual que en `ReporteSimpleBase`. Sin él, una
     * respuesta tardía del reporte anterior sobreescribía los datos del nuevo.
     */
    effect((onCleanup) => {
      const nodo = this.nivelActual();
      if (nodo) {
        const sub = this.cargar(nodo);
        onCleanup(() => sub.unsubscribe());
      }
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  private cargar(nodo: HierarquiaNodo): Subscription {
    this.cargando.set(true);
    return this.consultar({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel })
      .subscribe({
      // Carga independiente: `consultar()` emite cada vez que responde un bloque; con el primero
      // ya se muestra el reporte y los que faltan quedan con su esqueleto.
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
