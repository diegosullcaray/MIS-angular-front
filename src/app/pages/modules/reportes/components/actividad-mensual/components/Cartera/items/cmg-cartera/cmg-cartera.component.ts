import { Component, computed, effect, inject, signal } from '@angular/core';
import type { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TabsModule } from 'primeng/tabs';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { FechaCierreBotonComponent } from '../../../../../../../../../shared/ui/formularios/fecha-cierre-boton/fecha-cierre-boton.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { InlineErrorComponent } from '../../../../../../../../../shared/ui/inline-error/inline-error.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import {
  CMG_CARTERA_VACIO,
  FASE_CMG_CARTERA_POR_DEFECTO,
  OPCIONES_FASE_CMG_CARTERA,
  type CmgCarteraResultado,
  type TarjetaCmgCartera,
} from '../../../../../../models/cmg-cartera.model';
import type { OpcionFiltro } from '../../../../../../models/filtros.model';
import { ActividadMensualRepoService } from '../../../../services/actividad-mensual-repo.service';
import { GrupoFiltrosComponent } from '../../../../../../../../../shared/ui/formularios/grupo-filtros/grupo-filtros.component';
import { TarjetaMetaComponent } from '../../../../../../ui/tarjeta-meta/tarjeta-meta.component';
import { animarAnillos } from '../../../../../../ui/tarjeta-meta/animar-anillos';

/** "CMG Cartera" (`repositorio/actividad-mensual/cartera/cmg-cartera-m`). */
@Component({
  selector: 'app-mensual-cmg-cartera',
  standalone: true,
  imports: [
    TabsModule,
    HierSelectorComponent,
    TablaDinamicaComponent,
    SelectFiltroComponent,
    FechaCierreBotonComponent,
    EmptyStateComponent,
    InlineErrorComponent,
    WindowPanelComponent,
    GrupoFiltrosComponent,
    TarjetaMetaComponent,
  ],
  templateUrl: './cmg-cartera.component.html',
  styleUrl: './cmg-cartera.component.css',
})
export class CmgCarteraComponent {
  private readonly servicio = inject(ActividadMensualRepoService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesFase = OPCIONES_FASE_CMG_CARTERA;
  protected readonly fase = signal<number>(FASE_CMG_CARTERA_POR_DEFECTO);

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly reintentos = signal(0);
  protected readonly reporte = signal<CmgCarteraResultado>(CMG_CARTERA_VACIO);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly tarjetas = computed(() => this.reporte().tarjetas);
  protected readonly tabla = computed(() => this.reporte().tabla);

  protected readonly periodos = signal<OpcionFiltro[]>([]);
  protected readonly periodo = signal('');

  private readonly progresoAnillos = signal<Record<string, number>>({});
  private cancelarAnimacion = () => {};

  constructor() {
    this.servicio
      .periodos('RS_FECH')
      .pipe(takeUntilDestroyed())
      .subscribe((opciones) => {
        this.periodos.set(opciones);
        if (opciones.length > 0) this.periodo.set(String(opciones[0].id));
      });

    effect((onCleanup) => {
      const nodo = this.nivelActual();
      const fase = this.fase();
      const periodo = this.periodo();
      this.reintentos();
      if (nodo) {
        const consulta = this.cargar(nodo, fase, periodo);
        onCleanup(() => {
          consulta.unsubscribe();
          this.cancelarAnimacion();
        });
      }
    });
  }

  /** Pestaña de fase elegida (Total / Programas del Gobierno / Sin Programas de Gobierno). */
  protected cambiarFase(valor: string | number | undefined): void {
    if (valor !== undefined) this.fase.set(Number(valor));
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  /** Reemite el nivel actual para forzar una nueva consulta sin cambiar la selección. */
  protected refrescar(): void {
    const nodo = this.nivelActual();
    if (nodo) this.onNivelSeleccionado({ ...nodo });
  }

  protected valorAnillo(tarjeta: TarjetaCmgCartera): number {
    return this.progresoAnillos()[tarjeta.etiqueta] ?? 0;
  }

  protected reintentar(): void {
    this.reintentos.update((valor) => valor + 1);
  }

  private cargar(nodo: HierarquiaNodo, fase: number, periodo: string): Subscription {
    this.error.set(null);
    this.reporte.set(CMG_CARTERA_VACIO);
    this.progresoAnillos.set({});
    this.cargando.set(true);
    return this.servicio
      .cmgCartera({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, fase, periodo || undefined)
      .subscribe({
        next: (reporte) => {
          this.reporte.set(reporte);
          this.cargando.set(false);
          this.cancelarAnimacion = animarAnillos(reporte.tarjetas, this.progresoAnillos);
        },
        error: () => {
          this.error.set('No se pudo cargar el reporte. Inténtalo de nuevo en unos segundos.');
          this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
          this.cargando.set(false);
        },
      });
  }
}
