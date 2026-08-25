import { Component, computed, inject, signal } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { GraficoMixtoComponent } from '../../../../../../../../../shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import {
  COLUMNAS_GESTION_CLIENTES,
  COLUMNAS_GESTION_PRODUCCION,
  GESTION_COMERCIAL_VACIA,
  type GestionComercialResultado,
} from '../../models/gestion-comercial.model';
import { CarteraRepositorioService } from '../../services/cartera-repositorio.service';

/** "Gestión Comercial" (`repositorio/actividad-diaria/cartera/gest-comercial`). */
@Component({
  selector: 'app-gestion-comercial',
  standalone: true,
  imports: [
    TabsModule,
    HierSelectorComponent,
    TablaDinamicaComponent,
    GraficoMixtoComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './gestion-comercial.component.html',
  styleUrl: './gestion-comercial.component.css',
})
export class GestionComercialComponent {
  private readonly servicio = inject(CarteraRepositorioService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly columnasProduccion = COLUMNAS_GESTION_PRODUCCION;
  protected readonly columnasClientes = COLUMNAS_GESTION_CLIENTES;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly reporte = signal<GestionComercialResultado>(GESTION_COMERCIAL_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly filas = computed(() => this.reporte().filas);
  protected readonly varSaldoVigente = computed(() => this.reporte().varSaldoVigente);
  protected readonly varClientesStock = computed(() => this.reporte().varClientesStock);
  protected readonly graficos = computed(() => this.reporte().graficos);

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargando.set(true);

    this.servicio.gestionComercial({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
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
