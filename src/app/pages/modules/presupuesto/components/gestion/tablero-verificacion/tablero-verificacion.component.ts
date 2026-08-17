import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { HierSelectorComponent } from '../../../ui/hier-selector/hier-selector.component';
import { WindowPanelComponent } from '../../../../../../shared/ui/window-panel/window-panel.component';
import { filtrarPorDescripcion } from '../../../utils/texto.util';
import type { HierarquiaNodo, ParamsJerarquia } from '../../../models/jerarquia.model';
import type { LogVerificacionFila } from '../../../models/tablero-verificacion.model';

/**
 * Tablero de Verificación (`/app/presupuesto/gestion/seguimiento/tbl-ver`) —
 * migrado de `PreGesSegTableroVerificacionComponent` (legado STG). Es de solo
 * lectura, sin edición ni guardado.
 *
 * Necesita DOS nodos para consultar, pero salen de UN solo selector: son los
 * dos primeros niveles de la misma ruta, no dos selecciones independientes.
 * El legado montaba un único `hier-rem-selector` y consultaba solo cuando la
 * ruta emitida traía exactamente 2 nodos (`if (evt.length == 2)`, con
 * `lv = evt[0]` y `tv = evt[1]`); bajar a un tercer nivel vaciaba la tabla.
 * Se preserva tal cual — ver `HierSelectorComponent.rutaSeleccionada`.
 *
 * El legado hardcodeaba la raíz del árbol (`roots: [{ tip_cod: 7, cod_rel:
 * '231', lvl: 1 }]`, "Financiera Confianza") en vez de pedirla con
 * `getBaseHierarchy` — único caso del módulo que lo hace así (el resto de
 * pantallas sí pide la raíz al backend). Se preserva acá vía `raizFija`
 * (ver `HierSelectorComponent`), en vez de las 2 llamadas a `base_hier` que
 * haría el genérico por defecto.
 *
 * El orden de argumentos de `getLogVerificaciones` en el legado
 * (`tv.cod_rel, lv.cod_rel` — ambos códigos relacionales, ninguno el
 * `tip_cod` que el nombre del parámetro sugiere) no se pudo verificar contra
 * el componente real (no estaba en el volcado de referencia); se preserva
 * tal cual lo documentó la auditoría del legado.
 */
@Component({
  selector: 'app-tablero-verificacion',
  standalone: true,
  imports: [
    HierSelectorComponent,
    TableModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SkeletonModule,
    FormsModule,
    TooltipModule,
    WindowPanelComponent,
  ],
  templateUrl: './tablero-verificacion.component.html',
  styleUrl: './tablero-verificacion.component.css',
})
export class TableroVerificacionComponent {
  private readonly presupuesto = inject(PresupuestoService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier: ParamsJerarquia = { code: 9, maxLvl: 6, dlgTitulo: 'LINEAS PRESUPUESTO' };
  /** Raíz fija del legado — ver comentario de clase. */
  protected readonly raizFija: HierarquiaNodo[] = [{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza' }];

  protected readonly mostrarFiltros = signal(true);
  protected readonly cargando = signal(false);
  /** Última ruta emitida por el selector; se guarda para poder recargar. */
  private readonly ruta = signal<HierarquiaNodo[]>([]);
  protected readonly filas = signal<LogVerificacionFila[]>([]);
  protected readonly filtro = signal('');

  protected readonly filasFiltradas = computed(() => filtrarPorDescripcion(this.filas(), this.filtro()));
  protected readonly totalFilas = computed(() => this.filas().length);

  protected onRutaSeleccionada(ruta: HierarquiaNodo[]): void {
    this.ruta.set(ruta);
    this.cargarSiLaRutaTieneDosNiveles();
  }

  /** Botón "Actualizar" de la ventana: relee el histórico de la ruta elegida. */
  protected recargar(): void {
    this.cargarSiLaRutaTieneDosNiveles();
  }

  protected estadoIcono(codEst: number): { icono: string; color: string; titulo: string } {
    return codEst === 1
      ? { icono: 'pi pi-circle-fill', color: '#39ff14', titulo: 'Verificado' }
      : { icono: 'pi pi-circle-fill', color: '#fe2712', titulo: 'Pendiente' };
  }

  private cargarSiLaRutaTieneDosNiveles(): void {
    const ruta = this.ruta();
    this.filtro.set('');

    // Exactamente 2, como el legado: con la raíz sola todavía no hay qué pedir,
    // y bajando más niveles la consulta deja de aplicar.
    if (ruta.length !== 2) {
      this.filas.set([]);
      return;
    }

    const [lv, tv] = ruta;

    this.cargando.set(true);
    this.presupuesto.obtenerLogVerificaciones(Number(tv.cod_rel), lv.cod_rel).subscribe({
      next: (filas) => {
        this.filas.set(filas);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el tablero de verificación', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
