import { effect, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { ToastService } from '../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../utils/hier-selector-error.util';
import type { NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { HierarquiaNodo } from '../../../../../models/jerarquia.model';
import type { OpcionFiltro } from '../../../../../models/filtros.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import {
  FILTROS_DETALLE_INICIALES,
  paramsDetalleComunes,
  type FiltrosDetalleComunes,
} from '../models/portafolio-reasignado.model';
import { PortafolioReasignadoService } from '../services/portafolio-reasignado.service';

/**
 * Estado de los dos reportes que salen de los hosts `cra-v11`/`cra-v12`: una
 * pestaña de resumen y otra de detalle paginada del lado del servidor.
 *
 * Ambas consultas corren dentro de un `effect`, así que las señales de filtro
 * que lean quedan registradas y un cambio vuelve a consultar solo.
 */
export abstract class ReporteReasignadoTabsBase {
  protected readonly servicio = inject(PortafolioReasignadoService);
  protected readonly toast = inject(ToastService);

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargandoResumen = signal(false);
  protected readonly cargandoDetalle = signal(false);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargandoResumen);

  protected readonly resumen = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly detalle = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly totalDetalle = signal(0);
  protected readonly opcionesUltimaGestion = signal<OpcionFiltro[]>([]);

  /** Filtros comunes del detalle, con los valores por defecto del legado. */
  protected readonly asesor = signal(FILTROS_DETALLE_INICIALES.asesor);
  protected readonly fechaCompromiso = signal<Date | null>(FILTROS_DETALLE_INICIALES.fechaCompromiso);
  protected readonly ultimaGestion = signal(FILTROS_DETALLE_INICIALES.ultimaGestion);
  protected readonly pagina = signal(FILTROS_DETALLE_INICIALES.pagina);

  /** El legado solo consulta el asesor al pulsar el botón, no mientras se escribe. */
  private readonly asesorBuscado = signal(FILTROS_DETALLE_INICIALES.asesor);

  protected abstract consultarResumen(nodo: NodoConsulta): Observable<TablaReporteResultado>;
  protected abstract consultarDetalle(nodo: NodoConsulta, extra: Record<string, unknown>): Observable<TablaReporteResultado>;

  constructor() {
    this.servicio.opcionesUltimaGestion().subscribe({
      next: (opciones) => this.opcionesUltimaGestion.set(opciones),
      // Sin estas opciones el desplegable queda solo con "TODO": el detalle igual funciona.
      error: () => undefined,
    });

    effect(() => {
      const nodo = this.nivelActual();
      if (nodo) this.cargarResumen(nodo);
    });

    effect(() => {
      const nodo = this.nivelActual();
      if (nodo) this.cargarDetalle(nodo);
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  protected onBuscarAsesor(): void {
    this.asesorBuscado.set(this.asesor());
    this.pagina.set(1);
  }

  /** Parámetros comunes del detalle; la subclase suma los suyos leyendo sus propias señales. */
  protected paramsComunes(): Record<string, unknown> {
    const filtros: FiltrosDetalleComunes = {
      asesor: this.asesorBuscado(),
      fechaCompromiso: this.fechaCompromiso(),
      ultimaGestion: this.ultimaGestion(),
      pagina: this.pagina(),
    };
    return paramsDetalleComunes(filtros);
  }

  private cargarResumen(nodo: HierarquiaNodo): void {
    this.cargandoResumen.set(true);
    this.consultarResumen({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
      next: (tabla) => {
        this.resumen.set(tabla);
        this.cargandoResumen.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el resumen', 'Inténtalo de nuevo en unos segundos.');
        this.cargandoResumen.set(false);
      },
    });
  }

  private cargarDetalle(nodo: HierarquiaNodo): void {
    this.cargandoDetalle.set(true);
    this.consultarDetalle({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, this.paramsComunes()).subscribe({
      next: (tabla) => {
        this.detalle.set(tabla);
        this.totalDetalle.set(Number(tabla.additional['Total'] ?? 0));
        this.cargandoDetalle.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el detalle', 'Inténtalo de nuevo en unos segundos.');
        this.cargandoDetalle.set(false);
      },
    });
  }
}
