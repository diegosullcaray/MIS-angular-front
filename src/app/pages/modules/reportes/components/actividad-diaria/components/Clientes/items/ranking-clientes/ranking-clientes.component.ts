import { Component, inject, signal } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { TABLA_DINAMICA_VACIA, type TablaDinamicaResultado } from '../../../../../../models/tabla-dinamica.model';
import { RankingMujerService } from '../../services/ranking-mujer.service';

/** "Ranking Mujer" (`repositorio/actividad-diaria/mujer/mujer`) — legado `repositorio/ranking-mujer`. */
@Component({
  selector: 'app-ranking-clientes',
  standalone: true,
  imports: [HierSelectorComponent, TablaDinamicaComponent, EmptyStateComponent, WindowPanelComponent, TabsModule],
  templateUrl: './ranking-clientes.component.html',
  styleUrl: './ranking-clientes.component.css',
})
export class RankingClientesComponent {
  private readonly servicio = inject(RankingMujerService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly nuevas = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly cartera = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  /** Una pestaña por tabla, con los nombres del legado (`ranking-mujer.component.html`). */
  protected readonly tabs = [
    { id: 'nuevas', titulo: 'Ranking Clientes Nuevo Mujeres', tabla: this.nuevas },
    { id: 'cartera', titulo: 'Ranking Clientes Mujeres Total Cartera', tabla: this.cartera },
  ];

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargando.set(true);

    this.servicio.obtener({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
      next: ([nuevas, cartera]) => {
        this.nuevas.set(nuevas);
        this.cartera.set(cartera);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
