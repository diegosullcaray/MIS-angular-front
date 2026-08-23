import { Component, effect, inject, signal } from '@angular/core';
import { HierSelectorComponent } from '../../../../../ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../../../ui/tabla-reporte/tabla-reporte.component';
import { SelectFiltroComponent } from '../../../../../ui/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_MACRO, type HierarquiaNodo } from '../../../../../models/jerarquia.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import { OPCIONES_PRODUCTO_PASIVO, OPCIONES_SEGMENTO, TODOS } from '../../../../../models/filtros.model';
import { GestionPasivoComercialService } from '../../../services/gestion-pasivo-comercial.service';

/** "Gestión Pasivo Comercial" — Captación por Canal Operaciones (`capta-caract-canal-operacional`). */
@Component({
  selector: 'app-gestion-pasivo-comercial',
  standalone: true,
  imports: [HierSelectorComponent, TablaReporteComponent, SelectFiltroComponent, EmptyStateComponent, WindowPanelComponent],
  templateUrl: './gestion-pasivo-comercial.component.html',
  styleUrl: './gestion-pasivo-comercial.component.css',
})
export class GestionPasivoComercialComponent {
  private readonly servicio = inject(GestionPasivoComercialService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_MACRO;
  protected readonly opcionesProducto = OPCIONES_PRODUCTO_PASIVO;
  protected readonly opcionesSegmento = OPCIONES_SEGMENTO;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly producto = signal<string>(TODOS);
  protected readonly segmento = signal<string>(TODOS);
  protected readonly cargando = signal(false);
  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  constructor() {
    effect(() => {
      const nodo = this.nivelActual();
      const prod = this.producto();
      const seg = this.segmento();
      if (nodo) this.cargar(nodo, prod, seg);
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  private cargar(nodo: HierarquiaNodo, prod: string, segmento: string): void {
    this.cargando.set(true);
    this.servicio.obtener({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, prod, segmento).subscribe({
      next: ({ tabla1 }) => {
        this.tabla1.set(tabla1);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
