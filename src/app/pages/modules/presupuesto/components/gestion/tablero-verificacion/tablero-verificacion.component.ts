import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { HierSelectorComponent } from '../../../ui/hier-selector/hier-selector.component';
import { WindowPanelComponent } from '../../../../../../shared/ui/window-panel/window-panel.component';
import { filtrarPorDescripcion } from '../../../utils/texto.util';
import type { HierarquiaNodo, ParamsJerarquia } from '../../../models/jerarquia.model';
import type { LogVerificacionFila } from '../../../models/tablero-verificacion.model';

/** Tablero de Verificación (`/app/presupuesto/gestion/seguimiento/tbl-ver`) — migrado de `PreGesSegTableroVerificacionComponent` (legado STG). */
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
    WindowPanelComponent,
  ],
  templateUrl: './tablero-verificacion.component.html',
  styleUrl: './tablero-verificacion.component.css',
})
export class TableroVerificacionComponent {
  private readonly presupuesto = inject(PresupuestoService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier: ParamsJerarquia = { code: 9, maxLvl: 6, dlgTitulo: 'LINEAS PRESUPUESTO' };
  /** El legado hardcodeaba esta raíz ("Financiera Confianza") en vez de pedirla con `getBaseHierarchy`; se preserva. */
  protected readonly raizFija: HierarquiaNodo[] = [{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza' }];

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
