import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';
import { HierSelectorComponent } from '../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { PARAMS_HIER_UNIDAD } from '../../../../models/jerarquia.model';
import { DesarrolloSostenibleService } from '../../services/desarrollo-sostenible.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../utils/hier-selector-error.util';
import { OPCIONES_PRODUCTO_MISIONAL_PANEL } from '../../models/desarrollo-sostenible.model';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { HierarquiaNodo } from '../../../../models/jerarquia.model';
import { TABLA_DINAMICA_VACIA, type TablaDinamicaResultado } from '../../../../models/tabla-dinamica.model';

/** "Productos Misionales" — migrado de la ruta `repositorio/actividad-diaria/prod-misionales/productos-misionales` (legado STG, `reportes/repositorio/panel-misionales`, `cod_rep: prod_misi_01..05`). */
@Component({
  selector: 'app-productos-misionales',
  standalone: true,
  imports: [FormsModule, HierSelectorComponent, TablaDinamicaComponent, SelectModule, TabsModule, SkeletonModule, WindowPanelComponent],
  templateUrl: './productos-misionales.component.html',
  styleUrl: './productos-misionales.component.css',
})
export class ProductosMisionalesComponent {
  private readonly servicio = inject(DesarrolloSostenibleService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesProducto = OPCIONES_PRODUCTO_MISIONAL_PANEL;

  protected readonly tabActiva = signal('territorio');
  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly productoSeleccionado = signal('Todos');
  protected readonly cargando = signal(true);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly resumen = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly territorio = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly corredores = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly unidad = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly asesores = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargarReporte();
  }

  protected onProductoSeleccionado(prod: string): void {
    this.productoSeleccionado.set(prod);
    if (this.nivelActual()) this.cargarReporte();
  }

  private cargarReporte(): void {
    const nodo = this.nivelActual();
    if (!nodo) return;

    this.cargando.set(true);

    this.servicio.obtenerProductosMisionales({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, this.productoSeleccionado()).subscribe({
      next: ({ resumen, territorio, corredores, unidad, asesores }) => {
        this.resumen.set(resumen);
        this.territorio.set(territorio);
        this.corredores.set(corredores);
        this.unidad.set(unidad);
        this.asesores.set(asesores);
        this.cargando.set(false);

        if ([resumen, territorio, corredores, unidad, asesores].every((t) => t.filas.length === 0)) {
          this.toast.advertencia('Carga en proceso', 'Los datos podrían seguir procesándose en el servidor. Si ves valores en 0, intenta actualizar en unos minutos.');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
