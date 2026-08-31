import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { DatePickerModule } from 'primeng/datepicker';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { GraficoMixtoComponent } from '../../../../../../../../../shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { OpcionFiltro } from '../../../../../../models/filtros.model';
import {
  COLUMNAS_GESTION_CLIENTES,
  COLUMNAS_GESTION_PRODUCCION,
  GESTION_COMERCIAL_VACIA,
  INDICE_TRAS_VAR_CLIENTES,
  INDICE_TRAS_VAR_SALDO,
  claseCumplimiento,
  type GestionComercialResultado,
} from '../../models/gestion-comercial.model';
import { CarteraRepositorioService } from '../../services/cartera-repositorio.service';

/** "Gestión Comercial" (`repositorio/actividad-diaria/cartera/gest-comercial`). */
@Component({
  selector: 'app-gestion-comercial',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    TabsModule,
    DatePickerModule,
    HierSelectorComponent,
    SelectFiltroComponent,
    TablaDinamicaComponent,
    GraficoMixtoComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './gestion-comercial.component.html',
})
export class GestionComercialComponent {
  private readonly servicio = inject(CarteraRepositorioService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly columnasProduccion = COLUMNAS_GESTION_PRODUCCION;
  protected readonly columnasClientes = COLUMNAS_GESTION_CLIENTES;
  protected readonly claseCumplimiento = claseCumplimiento;
  /** Dónde van, por posición, las dos tablas de variación entre los gráficos — ver el modelo. */
  protected readonly indiceTrasVarSaldo = INDICE_TRAS_VAR_SALDO;
  protected readonly indiceTrasVarClientes = INDICE_TRAS_VAR_CLIENTES;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly reporte = signal<GestionComercialResultado>(GESTION_COMERCIAL_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  /**
   * El periodo del legado: NO es un calendario libre sino la lista de cortes que
   * devuelve `RS_FECH02`. Vacío mientras no responda; ahí el reporte usa la
   * fecha de corte del usuario o la fecha seleccionada en calendario.
   */
  protected readonly periodos = signal<OpcionFiltro[]>([]);
  protected readonly periodo = signal('');
  protected fechaCalendario: Date | null = null;

  protected readonly filas = computed(() => this.reporte().filas);
  protected readonly kpis = computed(() => this.reporte().kpis);
  protected readonly varSaldoVigente = computed(() => this.reporte().varSaldoVigente);
  protected readonly varClientesStock = computed(() => this.reporte().varClientesStock);
  protected readonly graficos = computed(() => this.reporte().graficos);

  constructor() {
    this.servicio.periodosGestionComercial().subscribe((opciones) => {
      this.periodos.set(opciones);
      // El legado deja seleccionado el primero, que es el corte más reciente.
      if (opciones.length > 0) this.periodo.set(opciones[0].id);
    });

    // Un cambio de periodo recarga el reporte sobre el nivel que ya esté abierto.
    effect(() => {
      const nodo = this.nivelActual();
      const periodo = this.periodo();
      if (nodo) this.cargar(nodo, periodo);
    });
  }

  /** Ancho de la barra de avance: el porcentaje, recortado para que no se salga de la tarjeta. */
  protected anchoBarra(porcentaje: number): number {
    return Math.max(0, Math.min(100, porcentaje));
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  protected onFechaCalendarioChange(fecha: Date | null): void {
    if (!fecha) return;
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    this.periodo.set(`${year}-${month}-${day}`);
  }

  private cargar(nodo: HierarquiaNodo, periodo: string): void {
    this.cargando.set(true);

    this.servicio.gestionComercial({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, periodo || undefined).subscribe({
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
