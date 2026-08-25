import { Component, effect, inject, signal } from '@angular/core';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { TABLA_DINAMICA_VACIA, type TablaDinamicaResultado } from '../../../../../../models/tabla-dinamica.model';
import { IMPULSA_POR_DEFECTO, OPCIONES_IMPULSA } from '../../models/portafolio-reasignado.model';
import { PortafolioReasignadoService } from '../../services/portafolio-reasignado.service';

/** "Efectividad de Cartera Reasignada" (`repositorio/actividad-diaria/reasignado/reasignado`). */
@Component({
  selector: 'app-efectividad-cartera-reasignada',
  standalone: true,
  imports: [
    HierSelectorComponent,
    TablaDinamicaComponent,
    SelectFiltroComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './efectividad-cartera-reasignada.component.html',
  styleUrl: './efectividad-cartera-reasignada.component.css',
})
export class EfectividadCarteraReasignadaComponent {
  private readonly servicio = inject(PortafolioReasignadoService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesImpulsa = OPCIONES_IMPULSA;
  protected readonly impulsa = signal<number>(IMPULSA_POR_DEFECTO);

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly tabla = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  constructor() {
    effect(() => {
      const nodo = this.nivelActual();
      const imp = this.impulsa();
      if (nodo) this.cargar(nodo, imp);
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  private cargar(nodo: HierarquiaNodo, imp: number): void {
    this.cargando.set(true);
    this.servicio.efectividadPorTramos({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, imp).subscribe({
      next: (tabla) => {
        this.tabla.set(tabla);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
