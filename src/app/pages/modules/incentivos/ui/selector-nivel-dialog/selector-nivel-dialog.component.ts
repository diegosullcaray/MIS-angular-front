import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { IncentivosService } from '../../services/incentivos.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { DataTableComponent } from '../../../../../shared/ui/data-table/data-table.component';
import { DataTableCellDirective } from '../../../../../shared/ui/data-table/data-table-cell.directive';
import type { DataTableColumn } from '../../../../../shared/ui/data-table/data-table.model';
import type { AsesorPickItem, NivelSelectorJerarquia, NodoJerarquiaIncentivo } from '../../models/incentivos-jerarquia.model';

type Vista = 'menu' | 'asesores' | 'jerarquia';

const COLUMNAS_ASESOR: DataTableColumn[] = [
  { field: 'des_sec', header: 'Asesor', filterType: 'text' },
  { field: 'des_uni', header: 'Unidad', filterType: 'text' },
  { field: 'des_cor', header: 'Corredor', filterType: 'text', mobileVisible: false },
  { field: 'des_ter', header: 'Territorio', filterType: 'text', mobileVisible: false },
];

const BUSQUEDA_ASESOR = ['des_sec', 'des_uni', 'des_cor', 'des_ter', 'cod_sec'];

const BUSQUEDA_JERARQUIA = ['des_rel'];

@Component({
  selector: 'app-selector-nivel-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, TooltipModule, DataTableComponent, DataTableCellDirective],
  templateUrl: './selector-nivel-dialog.component.html',
})
export class SelectorNivelDialogComponent {
  private readonly router = inject(Router);
  private readonly incentivos = inject(IncentivosService);
  private readonly toast = inject(ToastService);
  private readonly loading = inject(LoadingService);

  readonly visible = input(false);

  readonly visibleChange = output<boolean>();

  protected readonly niveles: NivelSelectorJerarquia[] = this.incentivos.nivelesSelector;
  protected readonly columnasAsesor = COLUMNAS_ASESOR;
  protected readonly camposBusquedaAsesor = BUSQUEDA_ASESOR;
  protected readonly camposBusquedaJerarquia = BUSQUEDA_JERARQUIA;

  protected readonly vista = signal<Vista>('menu');
  protected readonly nivelJerarquiaActivo = signal<NivelSelectorJerarquia | null>(null);
  protected readonly asesores = signal<AsesorPickItem[]>([]);
  protected readonly nodos = signal<NodoJerarquiaIncentivo[]>([]);
  protected readonly cargando = signal(false);

  protected readonly seleccionadoAsesor = signal<AsesorPickItem | null>(null);
  protected readonly seleccionadoNodo = signal<NodoJerarquiaIncentivo | null>(null);

  protected readonly haySeleccion = computed(() =>
    this.vista() === 'asesores' ? !!this.seleccionadoAsesor() : !!this.seleccionadoNodo()
  );

  protected readonly estiloDialogo = computed(() => ({
    width: '92vw',
    maxWidth: this.vista() === 'menu' ? '620px' : this.vista() === 'asesores' ? '1000px' : '720px',
  }));

  protected readonly columnasJerarquia = computed<DataTableColumn[]>(() => [
    { field: 'des_rel', header: this.nivelJerarquiaActivo()?.etiqueta ?? 'Descripción', filterType: 'text' },
  ]);

  protected abrirAsesores(): void {
    this.vista.set('asesores');
    this.limpiarSeleccion();
    this.cargando.set(true);
    this.loading.show('Cargando asesores…');
    this.incentivos.obtenerAsesores().subscribe({
      next: (lista) => {
        this.asesores.set(lista);
        this.terminarCarga();
      },
      error: () => {
        this.toast.error('No se pudo cargar la lista de asesores', 'Inténtalo de nuevo en unos segundos.');
        this.terminarCarga();
      },
    });
  }

  protected abrirNivelJerarquia(nivel: NivelSelectorJerarquia): void {
    this.vista.set('jerarquia');
    this.nivelJerarquiaActivo.set(nivel);
    this.limpiarSeleccion();
    this.cargando.set(true);
    this.loading.show('Cargando listado…');
    this.incentivos.obtenerNivelesJerarquia(nivel.tipCodListado).subscribe({
      next: (lista) => {
        this.nodos.set(lista);
        this.terminarCarga();
      },
      error: () => {
        this.toast.error('No se pudo cargar el listado', 'Inténtalo de nuevo en unos segundos.');
        this.terminarCarga();
      },
    });
  }

  protected confirmarSeleccion(): void {
    if (this.vista() === 'asesores') {
      const asesor = this.seleccionadoAsesor();
      if (asesor) this.confirmarYCerrar(() => this.incentivos.seleccionarAsesor(asesor));
      return;
    }

    const nodo = this.seleccionadoNodo();
    if (nodo) this.confirmarYCerrar(() => this.incentivos.seleccionarNodoJerarquia(nodo));
  }

  protected elegirFinancieraConfianza(claUsu: 1 | 2): void {
    this.confirmarYCerrar(() => this.incentivos.seleccionarFinancieraConfianza(claUsu));
  }

  private confirmarYCerrar(cargar: () => void): void {
    this.volverAlMenu();
    this.visibleChange.emit(false);
    cargar();
  }

  protected volverAlMenu(): void {
    this.vista.set('menu');
    this.limpiarSeleccion();
  }

  protected cerrar(): void {
    this.volverAlMenu();
    this.visibleChange.emit(false);
    if (!this.incentivos.perfil()) {
      this.router.navigate(['/app/dashboard']);
    }
  }

  private limpiarSeleccion(): void {
    this.seleccionadoAsesor.set(null);
    this.seleccionadoNodo.set(null);
  }

  private terminarCarga(): void {
    this.cargando.set(false);
    this.loading.hide();
  }
}
