import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HierSelectorComponent } from '../../../../../../ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../ui/tabla-dinamica/tabla-dinamica.component';
import { SelectFiltroComponent } from '../../../../../../ui/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import {
  CMG_CARTERA_VACIO,
  FASE_CMG_CARTERA_POR_DEFECTO,
  OPCIONES_FASE_CMG_CARTERA,
  type CmgCarteraResultado,
} from '../../models/cmg-cartera.model';
import { CarteraRepositorioService } from '../../services/cartera-repositorio.service';

/** "CMG Cartera" (`repositorio/actividad-diaria/cartera/cmg-cartera`). */
@Component({
  selector: 'app-cartera-cmg-cartera',
  standalone: true,
  imports: [
    DecimalPipe,
    HierSelectorComponent,
    TablaDinamicaComponent,
    SelectFiltroComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './cmg-cartera.component.html',
  styleUrl: './cmg-cartera.component.css',
})
export class CmgCarteraComponent {
  private readonly servicio = inject(CarteraRepositorioService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesFase = OPCIONES_FASE_CMG_CARTERA;
  protected readonly fase = signal<number>(FASE_CMG_CARTERA_POR_DEFECTO);

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly reporte = signal<CmgCarteraResultado>(CMG_CARTERA_VACIO);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly tarjetas = computed(() => this.reporte().tarjetas);
  protected readonly tabla = computed(() => this.reporte().tabla);

  constructor() {
    effect(() => {
      const nodo = this.nivelActual();
      const fase = this.fase();
      if (nodo) this.cargar(nodo, fase);
    });
  }

  /** Distingue la tarjeta numérica de la de texto (TAPP llega ya formateada). */
  protected isNumeroFinito(valor: number | string): boolean {
    return valor !== '' && Number.isFinite(Number(valor));
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  private cargar(nodo: HierarquiaNodo, fase: number): void {
    this.cargando.set(true);
    this.servicio.cmgCartera({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, fase).subscribe({
      next: (reporte) => {
        this.reporte.set(reporte);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
