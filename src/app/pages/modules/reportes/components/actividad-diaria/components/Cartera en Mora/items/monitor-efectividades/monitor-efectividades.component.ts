import { Component, computed, effect, inject, signal } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { DetalleReasignadoComponent } from '../../../Portafolio Reasignado/ui/detalle-reasignado/detalle-reasignado.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import type { OpcionFiltro } from '../../../../../../models/filtros.model';
import {
  OPCIONES_PRODUCTO_REASIGNADO,
  OPCIONES_SI_NO,
  OPCIONES_TRAMO,
  OPCIONES_TRAMO_DIAS_GESTION,
  TODO,
  paramsDetalleComunes,
} from '../../../Portafolio Reasignado/models/portafolio-reasignado.model';
import { OPCIONES_PRECOSECHA } from '../../models/cartera-en-mora.model';
import { CarteraMoraCraService } from '../../services/cartera-mora-cra.service';

/**
 * Monitor Efectividades — legado `RS_MON_EFEC` (host `cra-v4`).
 *
 * Dos pestañas, como el legado: el resumen (bloques `_01` y `_03`, este último
 * una vez por tramo, sin filtros propios) y el detalle (bloque `_02`, el único
 * con filtros y el único paginado). Sus diez filtros arrancan todos en "TODO".
 */
@Component({
  selector: 'app-monitor-efectividades',
  standalone: true,
  imports: [
    TabsModule,
    HierSelectorComponent,
    TablaReporteComponent,
    DetalleReasignadoComponent,
    SelectFiltroComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './monitor-efectividades.component.html',
})
export class MonitorEfectividadesComponent {
  private readonly servicio = inject(CarteraMoraCraService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly opcionesTramo = OPCIONES_TRAMO;
  protected readonly opcionesProducto = OPCIONES_PRODUCTO_REASIGNADO;
  protected readonly opcionesSiNo = OPCIONES_SI_NO;
  protected readonly opcionesTramoDias = OPCIONES_TRAMO_DIAS_GESTION;
  protected readonly opcionesPrecosecha = OPCIONES_PRECOSECHA;
  /** Las trae el backend (`SEL_EFEC_01`); hasta que lleguen, solo "TODO". */
  protected readonly opcionesUltimaGestion = signal<OpcionFiltro[]>([{ id: TODO, desc: 'TODO' }]);

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);

  // ── Pestaña 1: resumen ───────────────────────────────────────────────────────
  protected readonly cargandoResumen = signal(false);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargandoResumen);
  protected readonly tablasResumen = signal<TablaReporteResultado[]>([]);

  /** `content.higher`/`lower` de los tres bloques del resumen. */
  protected readonly bloquesResumen = [
    { titulo: 'Monitor de Efectividades', nota: undefined as string | undefined },
    {
      titulo: 'Resumen de Gestiones Ingresadas en Tramo -30-0: Operaciones Deterioradas',
      nota:
        '<b>a:</b> Número de clientes de riesgo alto y medio alto en el tramo de -30-0.<br>' +
        '<b>b:</b> Número de Gestiones realizadas entre Número de Clientes Gestionados.',
    },
    {
      titulo: 'Resumen de Gestiones Ingresadas en Tramo 1-30',
      nota:
        '<b>a:</b> Número de clientes de riesgo alto y medio alto en el tramo de 1-30.<br>' +
        '<b>b:</b> Número de Gestiones realizadas entre Número de Clientes Gestionados.',
    },
  ];

  // ── Pestaña 2: detalle, con sus diez filtros ─────────────────────────────────
  protected readonly cargandoDetalle = signal(false);
  protected readonly tablaDetalle = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly tramo = signal(TODO);
  protected readonly producto = signal(TODO);
  protected readonly compromisoRoto = signal(TODO);
  protected readonly ceroCuota = signal(TODO);
  protected readonly unaCuota = signal(TODO);
  protected readonly tramoDias = signal(TODO);
  protected readonly precosecha = signal(TODO);
  protected readonly ultimaGestion = signal(TODO);
  protected readonly fechaCompromiso = signal<Date | null>(null);
  protected readonly asesor = signal('');
  protected readonly pagina = signal(1);
  /** El legado solo consulta el asesor al pulsar "Buscar", no mientras se escribe. */
  protected readonly asesorBuscado = signal('');

  /** Total de filas que declara el backend, para el paginador. */
  protected readonly total = computed(() => Number(this.tablaDetalle().additional?.['Total'] ?? 0));

  constructor() {
    effect(() => {
      const nodo = this.nivelActual();
      if (nodo) this.cargarResumen(nodo);
    });

    // Cada filtro leído acá queda como dependencia: cambiarlo repite la consulta.
    effect(() => {
      const nodo = this.nivelActual();
      const filtros = this.filtrosDetalle();
      const pagina = this.pagina();
      if (nodo) this.cargarDetalle(nodo, filtros, pagina);
    });

    this.servicio.opcionesUltimaGestion().subscribe({
      next: (opciones) => this.opcionesUltimaGestion.set(opciones),
      // Si el catálogo no carga, el filtro se queda en "TODO" y el reporte sigue andando.
      error: () => undefined,
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  /** Los diez filtros traducidos a los parámetros exactos que espera el backend. */
  private filtrosDetalle(): Record<string, unknown> {
    return {
      tramof: this.tramo(),
      prod: this.producto(),
      comp_r: this.compromisoRoto(),
      zcuo: this.ceroCuota(),
      ucuo: this.unaCuota(),
      tdcr: this.tramoDias(),
      precosechaf: this.precosecha(),
      // `resp`, `fcompro` y `nom` (entre comodines) los arma el mismo helper que
      // ya usa Portafolio Reasignado, que sale del mismo host del legado.
      ...paramsDetalleComunes({
        asesor: this.asesorBuscado(),
        fechaCompromiso: this.fechaCompromiso(),
        ultimaGestion: this.ultimaGestion(),
        pagina: 1,
      }),
    };
  }

  private cargarResumen(nodo: HierarquiaNodo): void {
    this.cargandoResumen.set(true);
    this.servicio.monitorEfectividadesResumen({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
      next: (tablas) => {
        this.tablasResumen.set(tablas);
        this.cargandoResumen.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargandoResumen.set(false);
      },
    });
  }

  /** Botón "Buscar asesor" del legado: recién ahí viaja el texto. */
  protected onBuscarAsesor(): void {
    this.pagina.set(1);
    this.asesorBuscado.set(this.asesor());
  }

  private cargarDetalle(nodo: HierarquiaNodo, filtros: Record<string, unknown>, pagina: number): void {
    this.cargandoDetalle.set(true);
    this.servicio
      .monitorEfectividadesDetalle({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, filtros, pagina)
      .subscribe({
      next: (tabla) => {
        this.tablaDetalle.set(tabla);
        this.cargandoDetalle.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el detalle', 'Inténtalo de nuevo en unos segundos.');
        this.cargandoDetalle.set(false);
      },
    });
  }
}
