import { Component, effect, inject, signal } from '@angular/core';
import { HierSelectorComponent } from '../../../../../ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../../../ui/tabla-reporte/tabla-reporte.component';
import { SelectFiltroComponent } from '../../../../../ui/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_OFICINA, type HierarquiaNodo } from '../../../../../models/jerarquia.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import {
  CANAL_POR_DEFECTO,
  OPCIONES_CANAL,
  OPCIONES_TIPO_TRAMO_PLAZO,
  TIPO_TRAMO_PLAZO_POR_DEFECTO,
} from '../../../../../models/filtros.model';
import { GestionTasasPasivasService } from '../../../services/gestion-tasas-pasivas.service';
import { TabsModule } from 'primeng/tabs';

/** "Gestión de Tasas Pasivas" (`leg/com/rda/adm/tasa-pas`) — depósitos a plazo fijo por tipo de persona y moneda. */
@Component({
  selector: 'app-gestion-tasas-pasivas',
  standalone: true,
  imports: [HierSelectorComponent, TablaReporteComponent, SelectFiltroComponent, EmptyStateComponent, WindowPanelComponent,TabsModule],
  templateUrl: './gestion-tasas-pasivas.component.html',
  styleUrl: './gestion-tasas-pasivas.component.css',
})
export class GestionTasasPasivasComponent {
  private readonly servicio = inject(GestionTasasPasivasService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_OFICINA;
  protected readonly opcionesTipo = OPCIONES_TIPO_TRAMO_PLAZO;
  protected readonly opcionesCanal = OPCIONES_CANAL;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly tipo = signal(TIPO_TRAMO_PLAZO_POR_DEFECTO);
  protected readonly canal = signal(CANAL_POR_DEFECTO);

  protected readonly cargando = signal(false);
  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla2 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  constructor() {
    // Cambiar cualquiera de los dos filtros recarga el nivel ya elegido.
    effect(() => {
      const nodo = this.nivelActual();
      const agr = this.tipo();
      const varCanal = this.canal();
      if (nodo) this.cargar(nodo, agr, varCanal);
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  private cargar(nodo: HierarquiaNodo, agr: number, varCanal: number): void {
    this.cargando.set(true);
    this.servicio.obtener({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, { agr, var: varCanal }).subscribe({
      next: ({ tabla1, tabla2 }) => {
        this.tabla1.set(tabla1);
        this.tabla2.set(tabla2);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
