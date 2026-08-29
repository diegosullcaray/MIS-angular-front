import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { OpcionFiltro } from '../../../../../../models/filtros.model';
import {
  CARTERA_AGRICOLA_VACIA,
  type CarteraAgricolaResultado,
  type TotalAgro,
} from '../../../../../actividad-diaria/components/Cartera/models/cartera-agricola.model';
import { ActividadMensualRepoService } from '../../../../services/actividad-mensual-repo.service';

/** "Cartera Agrícola - Cultivos" (`repositorio/actividad-mensual/cartera/agro-mix-m`). */
@Component({
  selector: 'app-mensual-cartera-agricola-cultivos',
  standalone: true,
  providers: [DecimalPipe],
  imports: [
    HierSelectorComponent,
    SelectFiltroComponent,
    TablaDinamicaComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './cartera-agricola-cultivos.component.html',
  styleUrl: './cartera-agricola-cultivos.component.css',
})
export class CarteraAgricolaCultivosComponent {
  private readonly servicio = inject(ActividadMensualRepoService);
  private readonly toast = inject(ToastService);
  private readonly decimalPipe = inject(DecimalPipe);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly reporte = signal<CarteraAgricolaResultado>(CARTERA_AGRICOLA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly periodos = signal<OpcionFiltro[]>([]);
  protected readonly periodo = signal('');

  protected readonly totales = computed(() => this.reporte().totales);
  protected readonly tabla = computed(() => this.reporte().tabla);

  constructor() {
    this.servicio.periodos('RS_FECH').subscribe((opciones) => {
      this.periodos.set(opciones);
      if (opciones.length > 0) this.periodo.set(String(opciones[0].id));
    });

    effect(() => {
      const nodo = this.nivelActual();
      const periodo = this.periodo();
      if (nodo) this.cargar(nodo, periodo);
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  protected formatear(valor: number, formato: TotalAgro['formato']): string {
    switch (formato) {
      case 'moneda':
        return `S/ ${this.decimalPipe.transform(valor, '1.0-2') ?? '0'}`;
      default:
        return this.decimalPipe.transform(valor, '1.0-0') ?? '0';
    }
  }

  private cargar(nodo: HierarquiaNodo, periodo: string): void {
    this.cargando.set(true);
    this.servicio.carteraAgricola({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, periodo || undefined).subscribe({
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
