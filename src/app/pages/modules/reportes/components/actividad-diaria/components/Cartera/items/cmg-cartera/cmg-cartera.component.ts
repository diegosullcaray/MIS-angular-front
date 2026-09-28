import { Component, computed, effect, inject, signal } from '@angular/core';
import type { Subscription } from 'rxjs';
import { TabsModule } from 'primeng/tabs';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
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
import { CarteraRepositorioService } from '../../services/cartera-repositorio.service';
import { TarjetaMetaComponent } from '../../../../../../ui/tarjeta-meta/tarjeta-meta.component';
import { animarAnillos } from '../../../../../../ui/tarjeta-meta/animar-anillos';

/** "CMG Cartera" (`repositorio/actividad-diaria/cartera/cmg-cartera`). */
@Component({
  selector: 'app-cartera-cmg-cartera',
  standalone: true,
  imports: [
    TabsModule,
    HierSelectorComponent,
    TablaDinamicaComponent,
    EmptyStateComponent,
    InlineErrorComponent,
    WindowPanelComponent,
    TarjetaMetaComponent,
  ],
  templateUrl: './cmg-cartera.component.html',
})
export class CmgCarteraComponent {
  private readonly servicio = inject(CarteraRepositorioService);
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

  /** Progreso animado de cada aro (por etiqueta), de 0 al `cumplimiento` real. */
  private readonly progresoAnillos = signal<Record<string, number>>({});
  private cancelarAnimacion = () => {};

  constructor() {
    effect((onCleanup) => {
      const nodo = this.nivelActual();
      const fase = this.fase();
      this.reintentos();
      if (nodo) {
        const consulta = this.cargar(nodo, fase);
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

  /** Valor animado del aro de cumplimiento de una tarjeta (0 mientras no ha animado). */
  protected valorAnillo(tarjeta: TarjetaCmgCartera): number {
    return this.progresoAnillos()[tarjeta.etiqueta] ?? 0;
  }

  protected reintentar(): void {
    this.reintentos.update((valor) => valor + 1);
  }

  private cargar(nodo: HierarquiaNodo, fase: number): Subscription {
    this.error.set(null);
    this.reporte.set(CMG_CARTERA_VACIO);
    this.progresoAnillos.set({});
    this.cargando.set(true);
    return this.servicio
      .cmgCartera({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, fase)
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
