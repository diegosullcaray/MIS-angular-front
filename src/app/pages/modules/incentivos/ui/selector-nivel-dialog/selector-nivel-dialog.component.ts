import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { IncentivosService } from '../../services/incentivos.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { LoadingService } from '../../../../../shared/services/loading.service';
import type { AsesorPickItem, NivelSelectorJerarquia, NodoJerarquiaIncentivo } from '../../models/incentivos-jerarquia.model';

type Vista = 'menu' | 'asesores' | 'jerarquia';

/** Diálogo de selección de nivel y jerarquía en Incentivos. */
@Component({
  selector: 'app-selector-nivel-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, TableModule, InputTextModule, IconFieldModule, InputIconModule, FormsModule],
  templateUrl: './selector-nivel-dialog.component.html',
})
export class SelectorNivelDialogComponent {
  private readonly router = inject(Router);
  private readonly incentivos = inject(IncentivosService);
  private readonly toast = inject(ToastService);
  private readonly loading = inject(LoadingService);

  readonly visible = input(false);
  readonly obligatorio = input(false);

  readonly visibleChange = output<boolean>();

  protected readonly niveles: NivelSelectorJerarquia[] = this.incentivos.nivelesSelector;

  protected readonly vista = signal<Vista>('menu');
  protected readonly nivelJerarquiaActivo = signal<NivelSelectorJerarquia | null>(null);
  protected readonly filtro = signal('');
  protected readonly asesores = signal<AsesorPickItem[]>([]);
  protected readonly nodos = signal<NodoJerarquiaIncentivo[]>([]);
  protected readonly seleccionadoAsesor = signal<AsesorPickItem | null>(null);
  protected readonly seleccionadoNodo = signal<NodoJerarquiaIncentivo | null>(null);

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
    this.seleccionadoAsesor.set(null);
    this.loading.show('Cargando asesores…');
    this.incentivos.obtenerAsesores().subscribe({
      next: (lista) => {
        this.asesores.set(lista);
        this.loading.hide();
      },
      error: () => {
        this.toast.error('No se pudo cargar la lista de asesores', 'Inténtalo de nuevo en unos segundos.');
        this.loading.hide();
      },
    });
  }

  protected abrirNivelJerarquia(nivel: NivelSelectorJerarquia): void {
    this.vista.set('jerarquia');
    this.nivelJerarquiaActivo.set(nivel);
    this.filtro.set('');
    this.seleccionadoNodo.set(null);
    this.loading.show('Cargando listado…');
    this.incentivos.obtenerNivelesJerarquia(nivel.tipCodListado).subscribe({
      next: (lista) => {
        this.nodos.set(lista);
        this.loading.hide();
      },
      error: () => {
        this.toast.error('No se pudo cargar el listado', 'Inténtalo de nuevo en unos segundos.');
        this.loading.hide();
      },
    });
  }

  protected onFilaAsesor(item: AsesorPickItem | AsesorPickItem[] | undefined): void {
    if (item && !Array.isArray(item)) this.seleccionadoAsesor.set(item);
  }

  protected onFilaNodo(item: NodoJerarquiaIncentivo | NodoJerarquiaIncentivo[] | undefined): void {
    if (item && !Array.isArray(item)) this.seleccionadoNodo.set(item);
  }

  protected confirmarAsesor(): void {
    const item = this.seleccionadoAsesor();
    if (!item) return;
    this.confirmarYCerrar(() => this.incentivos.seleccionarAsesor(item));
  }

  protected confirmarNodo(): void {
    const item = this.seleccionadoNodo();
    if (!item) return;
    this.confirmarYCerrar(() => this.incentivos.seleccionarNodoJerarquia(item));
  }

  protected elegirFinancieraConfianza(claUsu: 1 | 2): void {
    this.confirmarYCerrar(() => this.incentivos.seleccionarFinancieraConfianza(claUsu));
  }

  private confirmarYCerrar(cargar: () => void): void {
    this.vista.set('menu');
    this.visibleChange.emit(false);
    cargar();
  }

  protected volverAlMenu(): void {
    this.vista.set('menu');
    this.filtro.set('');
    this.seleccionadoAsesor.set(null);
    this.seleccionadoNodo.set(null);
  }

  protected cerrar(): void {
    this.vista.set('menu');
    this.filtro.set('');
    this.seleccionadoAsesor.set(null);
    this.seleccionadoNodo.set(null);
    this.visibleChange.emit(false);
    this.router.navigate(['/app/dashboard']);
  }
}
