import { Component, computed, effect, inject, signal } from '@angular/core';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { GraficoMixtoComponent } from '../../../../../../../../../shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import {
  generarOpcionesFechaBase,
  fechaBasePorDefecto,
} from '../../../../models/actividad-mensual-filtros.model';
import {
  CARTERA_PRODUCTO_VACIO,
  type CarteraProductoResultado,
} from './models/cartera-producto.model';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { GrupoFiltrosComponent } from '../../../../../../../../../shared/ui/formularios/grupo-filtros/grupo-filtros.component';

/** "Cartera por Producto" (`leg/com/rma/adm/cart-prod`). */
@Component({
  selector: 'app-mensual-cartera-producto',
  standalone: true,
  imports: [
    HierSelectorComponent,
    TablaReporteComponent,
    GraficoMixtoComponent,
    SelectFiltroComponent,
    EmptyStateComponent,
    WindowPanelComponent,
    GrupoFiltrosComponent,
  ],
  templateUrl: './cartera-producto.component.html',
  styleUrl: './cartera-producto.component.css',
})
export class CarteraProductoComponent {
  private readonly servicio = inject(ActividadMensualCraService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesFechaBase = generarOpcionesFechaBase();
  protected readonly fechaBase = signal<string>(fechaBasePorDefecto());

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly reporte = signal<CarteraProductoResultado>(CARTERA_PRODUCTO_VACIO);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly tarjetas = computed(() => this.reporte().tarjetas);
  protected readonly graficos = computed(() => this.reporte().graficos);
  protected readonly tabla = computed(() => this.reporte().tabla);

  constructor() {
    effect(() => {
      const nodo = this.nivelActual();
      const fec = this.fechaBase();
      if (nodo) this.cargar(nodo, fec);
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  /** KPIs en enteros (millones redondeados), sin decimales. */
  protected formatearValor(valor: number | string): string {
    if (valor === '' || valor === null || valor === undefined) return '0';
    const num = typeof valor === 'number' ? valor : parseFloat(String(valor).replace(/,/g, ''));
    if (Number.isNaN(num)) return String(valor);
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  private cargar(nodo: HierarquiaNodo, fec: string): void {
    this.cargando.set(true);
    this.servicio
      .carteraProducto({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, fec || undefined)
      .subscribe({
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
