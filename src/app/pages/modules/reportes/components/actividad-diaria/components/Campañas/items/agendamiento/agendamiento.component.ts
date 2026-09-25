import { Component, computed, effect, inject, signal } from '@angular/core';
import type { Subscription } from 'rxjs';
import { TabsModule } from 'primeng/tabs';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { TABLA_DINAMICA_VACIA, type TablaDinamicaResultado } from '../../../../../../models/tabla-dinamica.model';
import {
  FILAS_POR_PAGINA_DETALLE_AGENDA,
  FILTRO_AGENDA_POR_DEFECTO,
  OPCIONES_NIVEL_FUGA,
  OPCIONES_NIVEL_PROPENSION,
  OPCIONES_RANGO_AGENDA,
} from '../../models/campanas.model';
import { CampanasService } from '../../services/campanas.service';
import { GrupoFiltrosComponent } from '../../../../../../../../../shared/ui/formularios/grupo-filtros/grupo-filtros.component';

/**
 * Agendamiento — legado `repositorio/agenda-comercial`.
 *
 * Cuatro tablas, una por pestaña. Los filtros no son los mismos en todas: el
 * legado oculta "Nivel de Fuga" en "Detalle Bases Vivas" y solo ahí muestra el
 * rango de fechas; "Nivel de propensión" está en las cuatro. Por eso cada
 * pestaña pone los suyos en vez de compartir una franja fija.
 *
 * Las cuatro se piden siempre juntas —cualquier filtro dispara las cuatro
 * consultas—, así que el rango elegido en "Detalle Bases Vivas" también llega
 * al bloque de la última pestaña aunque ahí ese filtro no se vea.
 *
 * Rendimiento: la pantalla se congelaba porque las cuatro tablas (las "Detalle" traen miles de
 * filas) se pintaban enteras y a la vez. Ahora, como el legado, las dos "Detalle" van paginadas de
 * a 10 en el cliente; solo se renderiza la tabla de la pestaña visible; cada tabla se muestra
 * apenas responde (carga independiente) y un cambio de filtro cancela las consultas anteriores.
 */
@Component({
  selector: 'app-agendamiento',
  standalone: true,
  imports: [
    TabsModule,
    HierSelectorComponent,
    TablaDinamicaComponent,
    SelectFiltroComponent,
    EmptyStateComponent,
    WindowPanelComponent,
    GrupoFiltrosComponent,
  ],
  templateUrl: './agendamiento.component.html',
})
export class AgendamientoComponent {
  private readonly servicio = inject(CampanasService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesFuga = OPCIONES_NIVEL_FUGA;
  protected readonly opcionesPropension = OPCIONES_NIVEL_PROPENSION;
  protected readonly opcionesRango = OPCIONES_RANGO_AGENDA;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly fuga = signal(FILTRO_AGENDA_POR_DEFECTO);
  protected readonly propension = signal(FILTRO_AGENDA_POR_DEFECTO);
  protected readonly rango = signal(FILTRO_AGENDA_POR_DEFECTO);

  protected readonly filasPorPaginaDetalle = FILAS_POR_PAGINA_DETALLE_AGENDA;

  protected readonly cargando = signal(false);
  /** Una entrada por tabla; `null` mientras esa tabla todavía no respondió. */
  protected readonly tablas = signal<(TablaDinamicaResultado | null)[]>([]);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  /** Pestaña visible: solo esa renderiza su tabla. */
  protected readonly pestana = signal<string | number | undefined>('resumen-total');

  /** Las cuatro tablas del legado, en el orden en que responde el service — una por pestaña. */
  protected readonly resumenTotal = computed(() => this.tablas()[0] ?? TABLA_DINAMICA_VACIA);
  protected readonly resumenPorBases = computed(() => this.tablas()[1] ?? TABLA_DINAMICA_VACIA);
  protected readonly detalleBasesVivas = computed(() => this.tablas()[2] ?? TABLA_DINAMICA_VACIA);
  protected readonly detalleBasesAutomaticas = computed(() => this.tablas()[3] ?? TABLA_DINAMICA_VACIA);

  constructor() {
    // `onCleanup` cancela las consultas en vuelo al cambiar de nivel o de filtro.
    effect((onCleanup) => {
      const nodo = this.nivelActual();
      const filtros = { fuga: this.fuga(), prop: this.propension(), rango: this.rango() };
      if (nodo) {
        const consulta = this.cargar(nodo, filtros);
        onCleanup(() => consulta.unsubscribe());
      }
    });
  }

  /** Si la tabla `indice` todavía está esperando su respuesta (muestra su esqueleto). */
  protected cargandoTabla(indice: number): boolean {
    return this.cargando() && !this.tablas()[indice];
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  private cargar(nodo: HierarquiaNodo, filtros: { fuga: number; prop: number; rango: number }): Subscription {
    this.cargando.set(true);
    this.tablas.set([]);
    return this.servicio.agendamiento({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, filtros).subscribe({
      next: (tablas) => this.tablas.set(tablas),
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
      complete: () => this.cargando.set(false),
    });
  }
}
