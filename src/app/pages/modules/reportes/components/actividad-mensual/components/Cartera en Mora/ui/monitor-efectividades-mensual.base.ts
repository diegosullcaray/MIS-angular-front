import { computed, effect, inject, signal } from '@angular/core';
import type { Observable, Subscription } from 'rxjs';
import { ToastService } from '../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../models/jerarquia.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { OpcionFiltro } from '../../../../../models/filtros.model';
import type { NodoConsulta } from '../../../../../services/bloque-reporte.service';
import {
  OPCIONES_PRODUCTO_REASIGNADO,
  OPCIONES_SI_NO,
  OPCIONES_TRAMO,
  OPCIONES_TRAMO_DIAS_GESTION,
  TODO,
  paramsDetalleComunes,
} from '../../../../actividad-diaria/components/Portafolio Reasignado/models/portafolio-reasignado.model';
import { fechaBasePorDefecto, generarOpcionesFechaBase } from '../../../models/actividad-mensual-filtros.model';
import { ActividadMensualCraService } from '../../../services/actividad-mensual-cra.service';

/**
 * Base de los dos Monitores de Efectividades mensuales (`mon-efec`, host `cra-v4`, y
 * `mon-efec-reasig`, host `cra-v12`). Como en el legado, van en dos pestañas:
 *
 * - **Monitor de Efectividades**: el resumen, que solo depende del nivel y de la Fecha Cierre.
 * - **Detalle de Efectividades**: el bloque `_02`, paginado en el servidor y con sus filtros
 *   propios (los del `_02` en `com-map.module.ts` más Última Gestión, Fecha Compromiso y Asesor
 *   del host). Cambiar uno de ellos solo vuelve a pedir el detalle.
 */
export abstract class MonitorEfectividadesMensualBase {
  protected readonly servicio = inject(ActividadMensualCraService);
  protected readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesFechaBase = generarOpcionesFechaBase();
  protected readonly fechaBase = signal<string>(fechaBasePorDefecto());
  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);

  // ── Pestaña 1: resumen ─────────────────────────────────────────────────────
  protected readonly cargandoResumen = signal(false);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargandoResumen);

  // ── Pestaña 2: detalle ─────────────────────────────────────────────────────
  protected readonly opcionesTramo = OPCIONES_TRAMO;
  protected readonly opcionesProducto = OPCIONES_PRODUCTO_REASIGNADO;
  protected readonly opcionesSiNo = OPCIONES_SI_NO;
  protected readonly opcionesTramoDias = OPCIONES_TRAMO_DIAS_GESTION;
  protected readonly opcionesUltimaGestion = signal<OpcionFiltro[]>([{ id: TODO, desc: 'TODO' }]);

  protected readonly tramo = signal(TODO);
  protected readonly producto = signal(TODO);
  protected readonly compromisoRoto = signal(TODO);
  protected readonly ceroCuota = signal(TODO);
  protected readonly unaCuota = signal(TODO);
  protected readonly tramoDias = signal(TODO);
  protected readonly ultimaGestion = signal(TODO);
  protected readonly fechaCompromiso = signal<Date | null>(null);
  protected readonly asesor = signal('');
  /** El asesor se aplica al pulsar "Buscar", no con cada tecla. */
  protected readonly asesorBuscado = signal('');
  protected readonly pagina = signal(1);

  protected readonly cargandoDetalle = signal(false);
  protected readonly detalle = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly totalDetalle = computed(() => Number(this.detalle().additional?.['Total'] ?? this.detalle().body.length));

  /** Consulta del resumen; corre dentro de un `effect`, así la Fecha Cierre queda como dependencia. */
  protected abstract cargarResumen(nodo: NodoConsulta, fecha: string): Subscription;

  /** Consulta del detalle, con los filtros ya armados. */
  protected abstract consultarDetalle(
    nodo: NodoConsulta,
    fecha: string,
    filtros: Record<string, unknown>,
    pagina: number,
  ): Observable<TablaReporteResultado>;

  /** Filtros del `_02` propios de cada reporte (el mensual suma "Precosecha"). */
  protected filtrosPropios(): Record<string, unknown> {
    return {};
  }

  constructor() {
    effect((onCleanup) => {
      const nodo = this.nivelActual();
      const fecha = this.fechaBase();
      if (!nodo) return;
      const sub = this.cargarResumen({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, fecha);
      onCleanup(() => sub.unsubscribe());
    });

    // Cada filtro leído acá es dependencia: cambiarlo repite solo la consulta del detalle.
    effect((onCleanup) => {
      const nodo = this.nivelActual();
      const fecha = this.fechaBase();
      const filtros = this.filtrosDetalle();
      const pagina = this.pagina();
      if (!nodo) return;
      this.cargandoDetalle.set(true);
      // El detalle va con el nodo completo de la jerarquía, como el legado (`...level`).
      const sub = this.consultarDetalle(nodo, fecha, filtros, pagina).subscribe({
        next: (tabla) => {
          this.detalle.set(tabla);
          this.cargandoDetalle.set(false);
        },
        error: () => {
          this.toast.error('No se pudo cargar el detalle', 'Inténtalo de nuevo en unos segundos.');
          this.cargandoDetalle.set(false);
        },
      });
      onCleanup(() => sub.unsubscribe());
    });

    this.servicio.opcionesUltimaGestion().subscribe({
      next: (opciones) => this.opcionesUltimaGestion.set(opciones),
      // Sin catálogo, el filtro se queda en "TODO" y el detalle sigue andando.
      error: () => undefined,
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.pagina.set(1);
    this.nivelActual.set(nodo);
  }

  protected onFechaBase(fecha: string): void {
    this.pagina.set(1);
    this.fechaBase.set(fecha);
  }

  protected onBuscarAsesor(): void {
    this.pagina.set(1);
    this.asesorBuscado.set(this.asesor());
  }

  private filtrosDetalle(): Record<string, unknown> {
    // `pagen` de `paramsDetalleComunes` lo pisa el servicio con la página pedida.
    const comunes = paramsDetalleComunes({
      asesor: this.asesorBuscado(),
      fechaCompromiso: this.fechaCompromiso(),
      ultimaGestion: this.ultimaGestion(),
      pagina: 1,
    });
    return {
      tramof: this.tramo(),
      prod: this.producto(),
      comp_r: this.compromisoRoto(),
      zcuo: this.ceroCuota(),
      ucuo: this.unaCuota(),
      tdcr: this.tramoDias(),
      ...this.filtrosPropios(),
      ...comunes,
    };
  }
}
