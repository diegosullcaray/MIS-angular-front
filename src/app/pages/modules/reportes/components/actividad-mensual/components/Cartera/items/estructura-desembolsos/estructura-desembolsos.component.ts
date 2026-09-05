import { Component, effect, inject, signal } from '@angular/core';
import { retry } from 'rxjs';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { TABLA_DINAMICA_VACIA, type TablaDinamicaResultado } from '../../../../../../models/tabla-dinamica.model';
import type { OpcionFiltro } from '../../../../../../../../../shared/ui/formularios/opcion-filtro.model';
import { ActividadMensualRepoService } from '../../../../services/actividad-mensual-repo.service';

/** \"Estructura de Desembolsos\" (`repositorio/actividad-mensual/cartera/estructura-desembolsos`).
 *
 * El legado mensual (`desembolsos-m`) usa `RS_DESEMB_02` con filtro de fechas (`RS_FECH`),
 * a diferencia de la versión diaria (`desembolsos`) que usa `RS_DESEMB_01` sin filtro.
 */
@Component({
  selector: 'app-mensual-estructura-desembolsos',
  standalone: true,
  imports: [
    HierSelectorComponent,
    TablaDinamicaComponent,
    SelectFiltroComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './estructura-desembolsos.component.html',
  styleUrl: './estructura-desembolsos.component.css',
})
export class EstructuraDesembolsosComponent {
  private readonly servicio = inject(ActividadMensualRepoService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly tabla = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  /** Opciones del filtro de periodos (RS_FECH) — igual que el legado `desembolsos-m`. */
  protected readonly opcionesFechaBase = signal<OpcionFiltro[]>([]);
  protected readonly fechaBase = signal<string>('');

  constructor() {
    // Carga las opciones de fechas al iniciar
    this.servicio.periodos('RS_FECH').subscribe({
      next: (opciones) => {
        this.opcionesFechaBase.set(opciones);
        if (opciones.length > 0) {
          this.fechaBase.set(opciones[0].id);
        }
      },
      error: () => { /* si falla, el filtro queda vacío y se usa la fecha del corte */ },
    });

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
      .estructuraDesembolsosMensual({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, fec)
      .pipe(retry({ count: 2, delay: 3_000 }))
      .subscribe({
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
