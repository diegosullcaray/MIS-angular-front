import { Component, computed, effect, inject, signal } from '@angular/core';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { GraficoMixtoComponent } from '../../../../../../../../../shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_OFICINA, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import {
  generarOpcionesFechaBase,
  fechaBasePorDefecto,
} from '../../../../models/actividad-mensual-filtros.model';
import {
  TASAS_MES_PRODUCTO_VACIO,
  type TasasMesProductoResultado,
} from './models/tasas-mes-producto.model';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';

/** "Tasas Mes por Producto" (`leg/com/rma/adm/tp-mes`). */
@Component({
  selector: 'app-mensual-tasas-mes-producto',
  standalone: true,
  imports: [
    HierSelectorComponent,
    GraficoMixtoComponent,
    SelectFiltroComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './tasas-mes-producto.component.html',
  styleUrl: './tasas-mes-producto.component.css',
})
export class TasasMesProductoComponent {
  private readonly servicio = inject(ActividadMensualCraService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_OFICINA;
  protected readonly opcionesFechaBase = generarOpcionesFechaBase();
  protected readonly fechaBase = signal<string>(fechaBasePorDefecto());

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly reporte = signal<TasasMesProductoResultado>(TASAS_MES_PRODUCTO_VACIO);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly tarjetas = computed(() => this.reporte().tarjetas);
  protected readonly graficos = computed(() => this.reporte().graficos);

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

  private cargar(nodo: HierarquiaNodo, fec: string): void {
    this.cargando.set(true);
    this.servicio
      .tasasMesProducto({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, fec || undefined)
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
