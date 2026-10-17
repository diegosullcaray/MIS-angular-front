import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Observable, finalize, map, of } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ModIncentivosService } from '../../../../../core/winder/instances/mod-incentivos.service';
import { ModSysAdminService } from '../../../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { DataTableComponent } from '../../../../../shared/ui/data-table/data-table.component';
import type { DataTableColumn } from '../../../../../shared/ui/data-table/data-table.model';
import type { NodoTablero } from '../../services/actividad-comercial.service';
import {
  COD_FINANCIERA,
  COD_JERARQUIA_TABLERO,
  NIVELES_SELECTOR_TABLERO,
  TIP_COD_ASESOR,
  TIP_COD_FINANCIERA,
} from '../../constantes/actividad-comercial.constantes';

type Vista = 'menu' | 'asesores' | 'nivel';
type Raiz = { tip_cod: number; cod_rel: string };
type Fila = { [key: string]: unknown; tip_cod: number; cod_rel: string; des_rel: string };

const COLUMNAS_ASESOR: DataTableColumn[] = [
  { field: 'des_rel', header: 'Asesor', filterType: 'text', width: '14rem' },
  { field: 'des_uni', header: 'Unidad', filterType: 'text', width: '10rem' },
  { field: 'des_cor', header: 'Corredor', filterType: 'text', width: '10rem' },
  { field: 'des_ter', header: 'Territorio', filterType: 'text', width: '10rem' },
];
const BUSQUEDA_ASESOR = ['des_rel', 'des_uni', 'des_cor', 'des_ter'];

/** Diálogo para que el administrador elija a quién ver en el tablero: asesor, unidad, corredor, territorio o la financiera. */
@Component({
  selector: 'app-selector-nivel-tablero',
  standalone: true,
  imports: [DialogModule, ButtonModule, DataTableComponent],
  templateUrl: './selector-nivel-tablero.component.html',
})
export class SelectorNivelTableroComponent {
  private readonly shell = inject(ShellStateService);
  private readonly toast = inject(ToastService);
  private readonly admin = inject(ModSysAdminService);
  private readonly incentivos = inject(ModIncentivosService);

  readonly visible = input(false);
  readonly visibleChange = output<boolean>();
  readonly nodoSeleccionado = output<NodoTablero>();

  protected readonly niveles = NIVELES_SELECTOR_TABLERO;
  protected readonly columnasAsesor = COLUMNAS_ASESOR;
  protected readonly camposBusquedaAsesor = BUSQUEDA_ASESOR;
  protected readonly vista = signal<Vista>('menu');
  protected readonly etiquetaNivel = signal('');
  protected readonly filas = signal<Fila[]>([]);
  protected readonly cargando = signal(false);
  protected readonly seleccionada = signal<Fila | null>(null);
  protected readonly columnasNivel = computed<DataTableColumn[]>(() => [
    { field: 'des_rel', header: this.etiquetaNivel(), filterType: 'text' },
  ]);

  /** Raíz de la jerarquía del usuario; los listados cuelgan de ella. */
  private raiz: Raiz | null = null;

  protected abrirAsesores(): void {
    this.abrirLista('asesores', 'Asesor', (r) =>
      this.admin.getListPick01(r.tip_cod, r.cod_rel).pipe(
        map((resp) =>
          ((resp.body as { list_res?: Record<string, unknown>[] } | null)?.list_res ?? []).map((a) => ({
            ...a,
            tip_cod: TIP_COD_ASESOR,
            cod_rel: String(a['cod_sec']),
            des_rel: String(a['des_sec']),
          })),
        ),
      ),
    );
  }

  protected abrirNivel(etiqueta: string, tipCodListado: number): void {
    this.abrirLista('nivel', etiqueta, (r) =>
      this.incentivos.getFromHierList(r.tip_cod, r.cod_rel, tipCodListado).pipe(
        map((resp) => (resp.body as { resultado?: Fila[] } | null)?.resultado ?? []),
      ),
    );
  }

  protected elegirFinanciera(): void {
    this.emitir({ tip_cod: TIP_COD_FINANCIERA, cod_rel: COD_FINANCIERA, des_rel: 'Financiera Confianza', desc_rel: undefined });
  }

  protected confirmar(): void {
    const fila = this.seleccionada();
    if (fila) this.emitir({ tip_cod: fila.tip_cod, cod_rel: fila.cod_rel, des_rel: fila.des_rel, desc_rel: undefined });
  }

  protected volver(): void {
    this.vista.set('menu');
    this.seleccionada.set(null);
  }

  protected cerrar(): void {
    this.volver();
    this.visibleChange.emit(false);
  }

  private emitir(nodo: NodoTablero): void {
    this.nodoSeleccionado.emit(nodo);
    this.cerrar();
  }

  private abrirLista(vista: Vista, etiqueta: string, pedir: (raiz: Raiz) => Observable<Fila[]>): void {
    this.vista.set(vista);
    this.etiquetaNivel.set(etiqueta);
    this.seleccionada.set(null);
    this.filas.set([]);
    this.cargando.set(true);
    this.obtenerRaiz().subscribe({
        next: (raiz) => pedir(raiz).pipe(finalize(() => this.cargando.set(false))).subscribe({
          next: (filas) => this.filas.set(filas),
          error: () => this.fallar(),
        }),
        error: () => this.fallar(),
      });
  }

  private obtenerRaiz(): Observable<Raiz> {
    if (this.raiz) return of(this.raiz);
    return this.admin.getBaseHierarchy(this.shell.usuarioActivo()?.email ?? '', COD_JERARQUIA_TABLERO).pipe(
      map((resp) => {
        const h = (resp.body as { base_hierarchy?: { tip_cod: number; cod_rel: string }[] } | null)?.base_hierarchy?.[0];
        if (!h) throw new Error('Sin jerarquía base');
        this.raiz = { tip_cod: h.tip_cod, cod_rel: h.cod_rel };
        return this.raiz;
      }),
    );
  }

  private fallar(): void {
    this.cargando.set(false);
    this.toast.error('No se pudo cargar el listado', 'Inténtalo de nuevo en unos segundos.');
  }
}
