import { Component, effect, inject, signal } from '@angular/core';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { OpcionFiltro } from '../../../../../../models/filtros.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { TODO } from '../../../Portafolio Reasignado/models/portafolio-reasignado.model';
import { CampanasService } from '../../services/campanas.service';

/**
 * "Reporte Mentoring" (`leg/com/rda/adm/RMentoring`) — legado `RMENTORIN`
 * (host `cra-v1p7`).
 *
 * No extiende `ReporteSimpleBase`: el legado
 * (`report-cra-v1p7.component.ts`) trae un filtro propio, "Asesor", cuyas
 * OPCIONES dependen del nivel elegido —no es un catálogo fijo, sale de
 * `SEL_JER_MENTORING_01` para ese nodo— y hace falta orquestar ese fetch
 * aparte del de la tabla.
 *
 * Al cambiar de nivel el legado descarta el asesor elegido y vuelve a
 * `'TODO'` (`renderUltGestion()` crea un `SelectService` nuevo cada vez);
 * acá se replica con `ultimoNodo` para no confundir "cambió el nivel" con
 * "cambió el asesor" dentro del mismo efecto.
 */
@Component({
  selector: 'app-mentoring',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './mentoring.component.html',
  styleUrl: './mentoring.component.css',
})
export class MentoringComponent {
  private readonly servicio = inject(CampanasService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly asesor = signal<string>(TODO);
  protected readonly opcionesAsesor = signal<OpcionFiltro<string>[]>([{ id: TODO, desc: 'TODO' }]);

  protected readonly cargando = signal(false);
  protected readonly tabla = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  /** Nodo del último `cargarTabla()` — para distinguir un cambio de nivel de uno de asesor dentro del mismo efecto. */
  private ultimoNodo: HierarquiaNodo | null = null;

  constructor() {
    effect(() => {
      const nodo = this.nivelActual();
      if (!nodo) return;

      if (nodo !== this.ultimoNodo) {
        this.ultimoNodo = nodo;
        this.cargarOpcionesAsesor(nodo);
        if (this.asesor() !== TODO) {
          // Dispara de nuevo este efecto, ya con el asesor reseteado.
          this.asesor.set(TODO);
          return;
        }
      }

      this.cargarTabla(nodo, this.asesor());
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  private cargarOpcionesAsesor(nodo: HierarquiaNodo): void {
    this.servicio.opcionesAsesorMentoring({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
      next: (opciones) => this.opcionesAsesor.set(opciones),
      error: () => this.opcionesAsesor.set([{ id: TODO, desc: 'TODO' }]),
    });
  }

  private cargarTabla(nodo: HierarquiaNodo, resp: string): void {
    this.cargando.set(true);
    this.servicio.mentoring({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, resp).subscribe({
      next: ({ tabla1 }) => {
        this.tabla.set(tabla1);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
