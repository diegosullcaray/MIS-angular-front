import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { IncentivosService } from '../../services/incentivos.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { AsesorPickItem, NivelSelectorJerarquia, NodoJerarquiaIncentivo } from '../../models';

type Vista = 'menu' | 'asesores' | 'jerarquia';

/**
 * Selector de nivel del Cuadro de Mando — reemplaza a
 * `SelectorJerComponent` + `SecPickerDialog2Service` + `TblPickerDialogService`
 * (legado STG, 3 piezas coordinadas por Subjects) con un único diálogo con
 * 3 vistas internas (`menu`/`asesores`/`jerarquia`), sin la variante enrutada
 * para mobile del legado — el layout de este Host ya es responsive.
 *
 * No migra la opción "Mi Perfil" del legado: ver la nota de
 * `IncentivosService` sobre el gap de datos de perfil (`niv`/`cla_use`).
 * En el modelo simplificado de este Host, `puedeElegirNivel` (que controla
 * si este diálogo puede abrirse) solo es `true` para el equivalente STAFF,
 * que en el legado tampoco tenía esa opción.
 */
@Component({
  selector: 'app-selector-nivel-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, TableModule, InputTextModule, IconFieldModule, InputIconModule, FormsModule],
  templateUrl: './selector-nivel-dialog.component.html',
  styleUrl: './selector-nivel-dialog.component.css',
})
export class SelectorNivelDialogComponent {
  private readonly incentivos = inject(IncentivosService);
  private readonly toast = inject(ToastService);

  readonly visible = input(false);
  /** `true` mientras no haya ningún nivel elegido todavía — oculta el botón de cerrar (equivalente a `disableClose=firstLoad` del legado). */
  readonly obligatorio = input(false);

  readonly visibleChange = output<boolean>();

  protected readonly niveles: NivelSelectorJerarquia[] = this.incentivos.nivelesSelector;

  protected readonly vista = signal<Vista>('menu');
  protected readonly nivelJerarquiaActivo = signal<NivelSelectorJerarquia | null>(null);
  protected readonly cargando = signal(false);
  protected readonly filtro = signal('');
  protected readonly asesores = signal<AsesorPickItem[]>([]);
  protected readonly nodos = signal<NodoJerarquiaIncentivo[]>([]);

  protected readonly asesoresFiltrados = computed(() => {
    const termino = this.filtro().toLowerCase().trim();
    if (!termino) return this.asesores();
    return this.asesores().filter(
      (a) => a.des_sec?.toLowerCase().includes(termino) || a.cod_sec?.toLowerCase().includes(termino)
    );
  });

  protected readonly nodosFiltrados = computed(() => {
    const termino = this.filtro().toLowerCase().trim();
    if (!termino) return this.nodos();
    return this.nodos().filter((n) => n.des_rel?.toLowerCase().includes(termino));
  });

  protected abrirAsesores(): void {
    this.vista.set('asesores');
    this.filtro.set('');
    this.cargando.set(true);
    this.incentivos.obtenerAsesores().subscribe({
      next: (lista) => {
        this.asesores.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar la lista de asesores', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }

  protected abrirNivelJerarquia(nivel: NivelSelectorJerarquia): void {
    this.vista.set('jerarquia');
    this.nivelJerarquiaActivo.set(nivel);
    this.filtro.set('');
    this.cargando.set(true);
    this.incentivos.obtenerNivelesJerarquia(nivel.tipCodListado).subscribe({
      next: (lista) => {
        this.nodos.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el listado', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }

  protected elegirAsesor(item: AsesorPickItem | AsesorPickItem[] | undefined): void {
    if (!item || Array.isArray(item)) return;
    this.incentivos.seleccionarAsesor(item);
    this.cerrar();
  }

  protected elegirNodo(item: NodoJerarquiaIncentivo | NodoJerarquiaIncentivo[] | undefined): void {
    if (!item || Array.isArray(item)) return;
    this.incentivos.seleccionarNodoJerarquia(item);
    this.cerrar();
  }

  protected elegirFinancieraConfianza(claUsu: 1 | 2): void {
    this.incentivos.seleccionarFinancieraConfianza(claUsu);
    this.cerrar();
  }

  protected volverAlMenu(): void {
    this.vista.set('menu');
    this.filtro.set('');
  }

  protected cerrar(): void {
    if (this.obligatorio()) return;
    this.vista.set('menu');
    this.visibleChange.emit(false);
  }
}
