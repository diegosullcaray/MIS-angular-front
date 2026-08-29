import { Component, computed, effect, inject, signal } from '@angular/core';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { TablaReporteComponent } from '../../../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import {
  generarOpcionesFechaBase,
  fechaBasePorDefecto,
} from '../../../../models/actividad-mensual-filtros.model';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';

/** "Programas del Gobierno" (`leg/com/rma/adm/pro-gob-m`). */
@Component({
  selector: 'app-mensual-programas-gobierno',
  standalone: true,
  imports: [
    WindowPanelComponent,
    HierSelectorComponent,
    SelectFiltroComponent,
    EmptyStateComponent,
    TablaReporteComponent,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
  ],
  templateUrl: './programas-gobierno.component.html',
  styleUrl: './programas-gobierno.component.css',
})
export class ProgramasGobiernoComponent {
  private readonly servicio = inject(ActividadMensualCraService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesFechaBase = generarOpcionesFechaBase();
  protected readonly fechaBase = signal<string>(fechaBasePorDefecto());

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly tablas = signal<TablaReporteResultado[]>([]);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly tabActiva = signal<string | number>('con-programas');

  protected readonly tabla1 = computed(() => this.tablas()[0]);
  protected readonly tabla2 = computed(() => this.tablas()[1]);
  protected readonly tabla3 = computed(() => this.tablas()[2]);
  protected readonly tabla4 = computed(() => this.tablas()[3]);

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
      .programasGobierno({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, fec || undefined)
      .subscribe({
        next: (tablas) => {
          this.tablas.set(tablas);
          this.cargando.set(false);
        },
        error: () => {
          this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
          this.cargando.set(false);
        },
      });
  }
}
