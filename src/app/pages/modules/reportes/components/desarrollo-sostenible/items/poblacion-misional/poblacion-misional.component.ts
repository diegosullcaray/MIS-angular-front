import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';
import { HierSelectorComponent } from '../../../../ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { PARAMS_HIER_UNIDAD } from '../../../../models/jerarquia.model';
import { DesarrolloSostenibleService } from '../../services/desarrollo-sostenible.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../utils/hier-selector-error.util';
import { OPCIONES_POBLACION_MISIONAL } from '../../models/desarrollo-sostenible.model';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { HierarquiaNodo } from '../../../../models/jerarquia.model';
import { TABLA_DINAMICA_VACIA, type TablaDinamicaResultado } from '../../../../models/tabla-dinamica.model';

/** "Poblaciones Misionales" — migrado de la ruta `repositorio/actividad-diaria/poblacion-misional/poblacion-misional` (legado STG, `reportes/repositorio/poblacion-misional`, `cod_rep: pob_misi_01..04`). */
@Component({
  selector: 'app-poblacion-misional',
  standalone: true,
  imports: [FormsModule, HierSelectorComponent, TablaDinamicaComponent, SelectModule, TabsModule, SkeletonModule, WindowPanelComponent],
  templateUrl: './poblacion-misional.component.html',
  styleUrl: './poblacion-misional.component.css',
})
export class PoblacionMisionalComponent {
  private readonly servicio = inject(DesarrolloSostenibleService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesPoblacion = OPCIONES_POBLACION_MISIONAL;

  protected readonly tabActiva = signal('territorio');
  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly poblacionSeleccionada = signal('ClientesNuevos');
  protected readonly cargando = signal(true);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly territorio = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly corredores = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly unidad = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly asesores = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargarReporte();
  }

  protected onPoblacionSeleccionada(prod: string): void {
    this.poblacionSeleccionada.set(prod);
    if (this.nivelActual()) this.cargarReporte();
  }

  private cargarReporte(): void {
    const nodo = this.nivelActual();
    if (!nodo) return;

    this.cargando.set(true);

    this.servicio.obtenerPoblacionMisional({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, this.poblacionSeleccionada()).subscribe({
      next: ({ territorio, corredores, unidad, asesores }) => {
        this.territorio.set(territorio);
        this.corredores.set(corredores);
        this.unidad.set(unidad);
        this.asesores.set(asesores);
        this.cargando.set(false);

        if ([territorio, corredores, unidad, asesores].every((t) => t.filas.length === 0)) {
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
