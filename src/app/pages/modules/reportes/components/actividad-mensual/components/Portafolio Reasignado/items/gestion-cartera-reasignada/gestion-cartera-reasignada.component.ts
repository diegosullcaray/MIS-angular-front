import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { PaginatorModule, type PaginatorState } from 'primeng/paginator';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { GrupoFiltrosComponent } from '../../../../../../../../../shared/ui/formularios/grupo-filtros/grupo-filtros.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import {
  OPCIONES_MOSTRAR_POR,
  MOSTRAR_POR_POR_DEFECTO,
  generarOpcionesFechaBase,
  fechaBasePorDefecto,
} from '../../../../models/actividad-mensual-filtros.model';
import {
  REPORTES_GESTION_CARTERA_REASIGNADA_MENSUAL,
  type ReporteGestionCarteraReasignadaMensual,
} from '../../../../constantes/actividad-mensual.constantes';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';

/** Filas por página del detalle: `paginator_size` de `theme_tb3`, el tema del bloque paginado. */
const POR_PAGINA = 30;

/**
 * "Gestión de Cartera Reasignada" mensual — host `cra-v11` del legado, que sirve dos rutas:
 * `leg/com/rma/adm/gest_cart_her` (`RS_AGE_COM_CRM`, "Mes") y `leg/com/rma/adm/gest_cart_her-flujo`
 * (`RS_AGE_COM_CRM_F`, "Base Flujo"). La ruta elige el reporte con `data.reporte`.
 *
 * Dos pestañas, como el legado: "Resumen" (`_01`) y "Detalle" (`_03`, paginado en el servidor con
 * `pagen` y el nodo completo de la jerarquía). "Mostrar por" y "Fecha Cierre" son filtros del
 * reporte: afectan a las dos pestañas y van lado a lado en la baldosa de filtros.
 */
@Component({
  selector: 'app-mensual-gestion-cartera-reasignada',
  standalone: true,
  imports: [
    TabsModule,
    PaginatorModule,
    HierSelectorComponent,
    TablaReporteComponent,
    SelectFiltroComponent,
    GrupoFiltrosComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './gestion-cartera-reasignada.component.html',
  styleUrl: './gestion-cartera-reasignada.component.css',
})
export class GestionCarteraReasignadaComponent {
  private readonly servicio = inject(ActividadMensualCraService);
  private readonly toast = inject(ToastService);

  /** `data.reporte` de la ruta (`withComponentInputBinding`). */
  readonly reporte = input<ReporteGestionCarteraReasignadaMensual>('RS_AGE_COM_CRM_F');
  protected readonly titulo = computed(() => REPORTES_GESTION_CARTERA_REASIGNADA_MENSUAL[this.reporte()]);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesMostrarPor = OPCIONES_MOSTRAR_POR;
  protected readonly mostrarPor = signal<number>(MOSTRAR_POR_POR_DEFECTO);
  protected readonly opcionesFechaBase = generarOpcionesFechaBase();
  protected readonly fechaBase = signal<string>(fechaBasePorDefecto());

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargandoResumen = signal(false);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargandoResumen);
  protected readonly resumen = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly cargandoDetalle = signal(false);
  protected readonly detalle = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly pagina = signal(1);
  protected readonly porPagina = POR_PAGINA;
  protected readonly totalDetalle = computed(() => Number(this.detalle().additional?.['Total'] ?? this.detalle().body.length));

  /** Nota del legado (`content.lower` de los dos bloques). */
  protected readonly nota =
    '<b>* Mide la distancia entre la geolocalización de la reacción de visita al cliente versus la geolocalización del domicilio legal registrada en el "Alta de persona".</b>';

  constructor() {
    // Nivel, "Mostrar por" y Fecha Cierre son dependencias; `onCleanup` cancela la consulta en vuelo.
    effect((onCleanup) => {
      const nodo = this.nivelActual();
      if (!nodo) return;
      this.cargandoResumen.set(true);
      const sub = this.servicio
        .gestionCarteraReasignadaResumen(this.reporte(), { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, this.mostrarPor(), this.fechaBase())
        .subscribe({
          next: (tabla) => {
            this.resumen.set(tabla);
            this.cargandoResumen.set(false);
          },
          error: () => {
            this.toast.error('No se pudo cargar el resumen', 'Inténtalo de nuevo en unos segundos.');
            this.cargandoResumen.set(false);
          },
        });
      onCleanup(() => sub.unsubscribe());
    });

    effect((onCleanup) => {
      const nodo = this.nivelActual();
      if (!nodo) return;
      this.cargandoDetalle.set(true);
      // El detalle va con el nodo completo de la jerarquía, como el `...level` del legado.
      const sub = this.servicio
        .gestionCarteraReasignadaDetalle(this.reporte(), nodo, this.mostrarPor(), this.fechaBase(), this.pagina())
        .subscribe({
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
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.pagina.set(1);
    this.nivelActual.set(nodo);
  }

  protected onMostrarPor(ver: number): void {
    this.pagina.set(1);
    this.mostrarPor.set(ver);
  }

  protected onFechaBase(fecha: string): void {
    this.pagina.set(1);
    this.fechaBase.set(fecha);
  }

  protected onPagina(evento: PaginatorState): void {
    this.pagina.set(Math.floor((evento.first ?? 0) / POR_PAGINA) + 1);
  }
}
