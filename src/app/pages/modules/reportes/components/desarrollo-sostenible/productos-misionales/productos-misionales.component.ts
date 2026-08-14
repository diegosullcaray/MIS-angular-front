import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { HierSelectorComponent } from '../../../ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../ui/tabla-dinamica/tabla-dinamica.component';
import { PARAMS_HIER_UNIDAD } from '../../../models/jerarquia.model';
import { DesarrolloSostenibleService } from '../../../services/desarrollo-sostenible.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../core/services/message.service';
import { crearManejadorErrorJerarquia } from '../../../utils/hier-selector-error.util';
import { OPCIONES_PRODUCTO_MISIONAL_PANEL } from '../../../models/desarrollo-sostenible/desarrollo-sostenible.model';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import type { TablaDinamicaResultado } from '../../../models/tabla-dinamica.model';

const TABLA_VACIA: TablaDinamicaResultado = { columnas: [], filas: [] };

/**
 * "Productos Misionales" — migrado de la ruta
 * `repositorio/actividad-diaria/prod-misionales/productos-misionales`
 * (legado STG, `reportes/repositorio/panel-misionales`, `cod_rep: prod_misi_01..05`).
 *
 * Motor `table.regular` (columnas dinámicas) en vez del motor "mixto" que
 * usan los demás reportes del módulo — reemplaza `mat-tab-group`/`stg-table2`
 * por `p-tabs`/`app-tabla-dinamica`, igual patrón que ya usa
 * `framework-esg/principal.component`. El mapeo tabla↔pestaña se confirmó
 * leyendo el `.ts`/`.html` legado completos (el orden de las llamadas NO
 * coincide con el de las pestañas): resumen=`_05`, Territorio=`_04`,
 * Corredores=`_01`, Unidad=`_02`, Asesores=`_03`.
 */
@Component({
  selector: 'app-productos-misionales',
  standalone: true,
  imports: [FormsModule, HierSelectorComponent, TablaDinamicaComponent, SelectModule, TabsModule, SkeletonModule, ButtonModule],
  templateUrl: './productos-misionales.component.html',
  styleUrl: './productos-misionales.component.css',
})
export class ProductosMisionalesComponent {
  private readonly servicio = inject(DesarrolloSostenibleService);
  private readonly toast = inject(ToastService);
  private readonly mensajes = inject(MessageService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesProducto = OPCIONES_PRODUCTO_MISIONAL_PANEL;

  protected readonly mostrarFiltros = signal(true);
  protected readonly tabActiva = signal('resumen');
  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly productoSeleccionado = signal('Todos');
  protected readonly cargando = signal(true);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly resumen = signal<TablaDinamicaResultado>(TABLA_VACIA);
  protected readonly territorio = signal<TablaDinamicaResultado>(TABLA_VACIA);
  protected readonly corredores = signal<TablaDinamicaResultado>(TABLA_VACIA);
  protected readonly unidad = signal<TablaDinamicaResultado>(TABLA_VACIA);
  protected readonly asesores = signal<TablaDinamicaResultado>(TABLA_VACIA);

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
          this.mensajes.warn(
            'Los datos podrían seguir procesándose en el servidor. Si ves valores en 0, intenta actualizar en unos minutos.',
            'Carga en proceso',
          );
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
