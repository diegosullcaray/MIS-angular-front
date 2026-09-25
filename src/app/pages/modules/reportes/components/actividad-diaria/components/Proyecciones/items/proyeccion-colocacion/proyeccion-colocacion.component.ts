import { Component, effect, inject, linkedSignal, signal } from '@angular/core';
import { Observable, map, type Subscription } from 'rxjs';
import { ReporteSimpleComponent, type PestanaReporte } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { ProyeccionesService } from '../../services/proyecciones.service';

/** Título de las dos pestañas: el mapa (`com-map.module.ts`) les da el mismo `content.higher`. */
const TITULO = 'Colocaciones (número de operaciones y montos de desembolso)';

/**
 * "Proyección colocación" (`leg/com/rda/adm/proy_M1`) — legado `PROYEC_COLREC` sobre el host
 * `cra-v11` (mapa `com`), con dos pestañas:
 *
 * - **Resumen** (`_01`): un bloque con `fec` y la nota de "Total de Proyecciones".
 * - **Detalle** (`_03`): tabla PAGINADA EN EL SERVIDOR (`app-table-ajax`, 30 filas), pedida con
 *   `pagen` y el nodo completo de la jerarquía (`rendererSync()`). Cambiar de página solo vuelve a
 *   pedir el detalle; cambiar de nivel vuelve a la primera página.
 */
@Component({
  selector: 'app-proyeccion-colocacion',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './proyeccion-colocacion.component.html',
})
export class ProyeccionColocacionComponent extends ReporteBloquesBase {
  private readonly servicio = inject(ProyeccionesService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  /** El bloque de la pestaña "Resumen". */
  protected readonly titulos = [TITULO];

  /** `content.lower` del `_01`. */
  protected override readonly notas = ['<b>Total de Proyecciones</b> → Cli. Evaluado + Listo para comité + Listo para desembolso'];

  /** Detalle (`_03`), con su propia página y su propia carga. */
  protected readonly paginaDetalle = signal(1);
  protected readonly detalle = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly cargandoDetalle = signal(false);

  /** Total que declara el backend (`additional.Total`); se conserva mientras carga otra página. */
  protected readonly totalDetalle = linkedSignal<{ tabla: TablaReporteResultado; cargando: boolean }, number | null>({
    source: () => ({ tabla: this.detalle(), cargando: this.cargandoDetalle() }),
    computation: ({ tabla, cargando }, previo) => {
      const total = Number(tabla.additional?.['Total']);
      if (Number.isFinite(total) && total > 0) return total;
      return cargando ? (previo?.value ?? null) : null;
    },
  });

  constructor() {
    super();
    // El detalle se pide con el nodo COMPLETO (la base recorta a `tip_cod`/`cod_rel`) y la página.
    effect((onCleanup) => {
      const nodo = this.nivelActual();
      const pagina = this.paginaDetalle();
      if (nodo) {
        const consulta = this.cargarDetalle(nodo, pagina);
        onCleanup(() => consulta.unsubscribe());
      }
    });
  }

  protected override onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.paginaDetalle.set(1);
    super.onNivelSeleccionado(nodo);
  }

  /** Las dos pestañas de `cra-v11`, en su orden. */
  protected pestanas(): PestanaReporte[] {
    return [
      { id: 'resumen', titulo: 'Resumen', bloques: this.bloques() },
      {
        id: 'detalle',
        titulo: 'Detalle',
        bloques: [{ titulo: TITULO, tabla: this.detalle(), cargando: this.cargandoDetalle(), paginado: true }],
      },
    ];
  }

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.colocacionResumen(nodo).pipe(map((tabla) => [tabla]));
  }

  private cargarDetalle(nodo: HierarquiaNodo, pagina: number): Subscription {
    this.cargandoDetalle.set(true);
    this.detalle.set(TABLA_VACIA);
    return this.servicio.colocacionDetalle(nodo, pagina).subscribe({
      next: (tabla) => {
        this.detalle.set(tabla);
        this.cargandoDetalle.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el detalle', 'Inténtalo de nuevo en unos segundos.');
        this.cargandoDetalle.set(false);
      },
    });
  }
}
