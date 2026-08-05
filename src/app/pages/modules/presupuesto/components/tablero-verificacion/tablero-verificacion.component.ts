import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { PresupuestoService } from '../../services/presupuesto.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { HierSelectorComponent } from '../../ui/hier-selector/hier-selector.component';
import type { HierarquiaNodo, LogVerificacionFila, ParamsJerarquia } from '../../models';

/**
 * Tablero de Verificación (`/app/presupuesto/gestion/seguimiento/tbl-ver`) —
 * migrado de `PreGesSegTableroVerificacionComponent` (legado STG). A
 * diferencia de las demás pantallas, necesita DOS niveles de jerarquía
 * elegidos simultáneamente (Línea + un segundo nivel) antes de poder cargar
 * el histórico — es de solo lectura, sin edición ni guardado.
 *
 * El legado hardcodeaba la raíz del árbol (`roots: [{ tip_cod: 7, cod_rel:
 * '231', lvl: 1 }]`) en vez de pedirla con `getBaseHierarchy` — acá se usa
 * el mismo `HierSelectorComponent` genérico (que sí la pide al backend) para
 * ambos niveles, por consistencia con el resto del módulo.
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
  imports: [HierSelectorComponent, TableModule, InputTextModule, SkeletonModule, FormsModule],
  templateUrl: './tablero-verificacion.component.html',
  styleUrl: './tablero-verificacion.component.css',
})
export class TableroVerificacionComponent {
  private readonly presupuesto = inject(PresupuestoService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier: ParamsJerarquia = { code: 9, maxLvl: 6, dlgTitulo: 'LINEAS PRESUPUESTO' };

  protected readonly cargando = signal(false);
  protected readonly nivelLinea = signal<HierarquiaNodo | null>(null);
  protected readonly nivelSegundo = signal<HierarquiaNodo | null>(null);
  protected readonly filas = signal<LogVerificacionFila[]>([]);
  protected readonly filtro = signal('');

  protected readonly filasFiltradas = computed(() => {
    const termino = this.filtro().trim().toLowerCase();
    if (!termino) return this.filas();
    return this.filas().filter((f) => f.des_rel.toLowerCase().includes(termino));
  });

  protected onLineaSeleccionada(nodo: HierarquiaNodo): void {
    this.nivelLinea.set(nodo);
    this.cargarSiAmbosNivelesListos();
  }

  protected onSegundoNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelSegundo.set(nodo);
    this.cargarSiAmbosNivelesListos();
  }

  protected estadoIcono(codEst: number): { icono: string; color: string; titulo: string } {
    return codEst === 1
      ? { icono: 'pi pi-circle-fill', color: '#39ff14', titulo: 'Verificado' }
      : { icono: 'pi pi-circle-fill', color: '#fe2712', titulo: 'Pendiente' };
  }

  private cargarSiAmbosNivelesListos(): void {
    const lv = this.nivelLinea();
    const tv = this.nivelSegundo();
    this.filtro.set('');

    if (!lv || !tv) {
      this.filas.set([]);
      return;
    }

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
