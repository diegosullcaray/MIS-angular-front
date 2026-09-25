import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import type { Subscription } from 'rxjs';
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
import { nodoDeFila } from '../../../../../../utils/nodo-fila.util';
import { RutaJerarquicaComponent } from '../../../../../../ui/ruta-jerarquica/ruta-jerarquica.component';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { OpcionFiltro } from '../../../../../../models/filtros.model';
import {
  CLAVE_DRILL_DOWN_GESTION,
  COLUMNAS_GESTION_CLIENTES,
  COLUMNAS_GESTION_PRODUCCION,
  GESTION_COMERCIAL_VACIA,
  INDICE_TRAS_VAR_CLIENTES,
  INDICE_TRAS_VAR_SALDO,
  claseCumplimiento,
  type GestionComercialResultado,
} from '../../models/gestion-comercial.model';
import { CarteraRepositorioService } from '../../services/cartera-repositorio.service';
import { GrupoFiltrosComponent } from '../../../../../../../../../shared/ui/formularios/grupo-filtros/grupo-filtros.component';

/**
 * "Gestión Comercial" (`repositorio/actividad-diaria/cartera/gest-comercial`) — legado
 * `repositorio/gestion-comercial`.
 *
 * Se navega por drill down, como el legado: la jerarquía arranca en el nodo autorizado
 * (`getBaseHierAsync`), la descripción de cada fila baja a ese nivel (`ddHier`, con `htipcod` +
 * `hcodrel`) y las migas vuelven atrás (`changeHier` sobre `hierBuffer`). El selector de jerarquía
 * queda oculto; el único filtro visible es el periodo (`RS_FECH02`).
 */
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
    GrupoFiltrosComponent,
    RutaJerarquicaComponent,
  ],
  templateUrl: './gestion-comercial.component.html',
})
export class GestionComercialComponent {
  private readonly servicio = inject(CarteraRepositorioService);
  private readonly toast = inject(ToastService);
  private readonly selectorJerarquia = viewChild(HierSelectorComponent);

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

  /** Ruta de la raíz al nivel actual, para las migas (`hierBuffer` del legado). */
  protected readonly rutaJerarquica = signal<HierarquiaNodo[]>([]);

  /** La descripción solo es clicable si alguna fila tiene a dónde bajar. */
  protected readonly columnasDrillDown = computed(() =>
    this.filas().some((fila) => this.nodoHijo(fila)) ? [CLAVE_DRILL_DOWN_GESTION] : [],
  );

  constructor() {
    this.servicio.periodosGestionComercial().subscribe((opciones) => {
      this.periodos.set(opciones);
      // El legado deja seleccionado el primero, que es el corte más reciente.
      if (opciones.length > 0) this.periodo.set(opciones[0].id);
    });

    // Un cambio de periodo recarga el reporte sobre el nivel que ya esté abierto.
    // `onCleanup` cancela la consulta en vuelo al bajar/subir de nivel o cambiar de periodo, para
    // que la respuesta tardía de un nivel no pise la del siguiente.
    effect((onCleanup) => {
      const nodo = this.nivelActual();
      const periodo = this.periodo();
      if (nodo) {
        const consulta = this.cargar(nodo, periodo);
        onCleanup(() => consulta.unsubscribe());
      }
    });
  }

  /** Ancho de la barra de avance: el porcentaje, recortado para que no se salga de la tarjeta. */
  protected anchoBarra(porcentaje: number): number {
    return Math.max(0, Math.min(100, porcentaje));
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  protected onRutaSeleccionada(ruta: HierarquiaNodo[]): void {
    this.rutaJerarquica.set(ruta);
  }

  /** Clic en una celda: solo la descripción baja de nivel, como `ddHier` del legado. */
  protected onCeldaSeleccionada({ clave, fila }: { clave: string; fila: Record<string, unknown> }): void {
    if (clave !== CLAVE_DRILL_DOWN_GESTION) return;
    const nodo = this.nodoHijo(fila);
    if (!nodo) return;

    // Por el selector oculto, que emite el nodo y la ruta nueva. Si el nodo no está entre sus
    // opciones, se agrega a la ruta y se consulta igual.
    if (!this.selectorJerarquia()?.seleccionarNodo(nodo)) {
      this.rutaJerarquica.update((ruta) => [...ruta, nodo]);
      this.onNivelSeleccionado(nodo);
    }
  }

  /** Clic en una miga: vuelve a ese nivel y recorta la ruta (`changeHier`). */
  protected volverANivel(indice: number): void {
    const ruta = this.rutaJerarquica();
    const nodo = ruta[indice];
    if (!nodo || indice === ruta.length - 1) return;

    if (!this.selectorJerarquia()?.seleccionarNodo(nodo)) {
      this.rutaJerarquica.set(ruta.slice(0, indice + 1));
      this.onNivelSeleccionado(nodo);
    }
  }

  /** Nodo al que baja la fila; `null` para la fila del nivel que ya se está viendo (el total). */
  private nodoHijo(fila: Record<string, unknown>): HierarquiaNodo | null {
    const nodo = nodoDeFila(fila, CLAVE_DRILL_DOWN_GESTION);
    const actual = this.nivelActual();
    if (!nodo || (actual && nodo.tip_cod === actual.tip_cod && nodo.cod_rel === actual.cod_rel)) return null;
    return nodo;
  }

  protected onFechaCalendarioChange(fecha: Date | null): void {
    if (!fecha) return;
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    this.periodo.set(`${year}-${month}-${day}`);
  }

  private cargar(nodo: HierarquiaNodo, periodo: string): Subscription {
    this.cargando.set(true);

    return this.servicio.gestionComercial({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, periodo || undefined).subscribe({
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
