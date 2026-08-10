import { Component, computed, inject, signal } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { FrameworkEsgService } from '../../services/framework-esg.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { CategoriaMetricasTablaComponent } from '../../ui/categoria-metricas-tabla/categoria-metricas-tabla.component';
import { EditarMetricaDialogComponent } from '../../ui/editar-metrica-dialog/editar-metrica-dialog.component';
import { UsuariosMetricaDialogComponent } from '../../ui/usuarios-metrica-dialog/usuarios-metrica-dialog.component';
import type {
  EsgConfiguracionModulo,
  EsgMetricaFila,
  EsgMetricaListItem,
  EsgResumenCategoria,
  EsgResumenPortadaFila,
} from '../../models';

interface TabCategoria {
  codCat: number;
  titulo: string;
}

/**
 * Orden de pestañas y mapeo de `cod_cat` — igual que `arrOrd`/el
 * `mat-tab-group` del legado STG (`principal.component.html`): el orden
 * visual (Medioambiente, Social Empleado, Social Cliente, Gobierno) NO
 * coincide con el orden numérico de `cod_cat` (1, 3, 2, 4).
 */
const TABS_CATEGORIAS: TabCategoria[] = [
  { codCat: 1, titulo: 'Medioambiente' },
  { codCat: 3, titulo: 'Social | Empleado' },
  { codCat: 2, titulo: 'Social | Cliente' },
  { codCat: 4, titulo: 'Gobierno' },
];

/**
 * Cuadro de Mando ESG (`/app/esg`) — migrado de `PrincipalComponent`
 * (legado STG, `pages/modules/framework-esg/principal`). Reemplaza
 * `mat-tab-group`/`stg-table2` (Angular Material + tabla custom) por
 * `p-tabs`/`p-table` (PrimeNG) + Tailwind, y `MatDialog` por diálogos
 * standalone (`EditarMetricaDialogComponent`/`UsuariosMetricaDialogComponent`)
 * — sin la variante enrutada para mobile del legado (`showE()`/`showUse()`
 * navegaban a `./editar`/`./usuarios` en mobile): el layout de este Host ya
 * es responsive.
 *
 * El `is_admin` que viaja a `esg.res_cat` es el admin del Host
 * (`ShellStateService.esAdmin()`, equivalente al `profile.tip_use===0` del
 * legado) — el flag `mod_admin.cfg` de `esg.cfg_mod` solo controla la
 * visibilidad de los botones "Editar"/"Usuarios" en esta pantalla (ver
 * `esAdmin` computed), igual que en el legado.
 */
@Component({
  selector: 'app-esg-principal',
  standalone: true,
  imports: [
    TabsModule,
    ButtonModule,
    TableModule,
    SkeletonModule,
    CategoriaMetricasTablaComponent,
    EditarMetricaDialogComponent,
    UsuariosMetricaDialogComponent,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.css',
})
export class PrincipalComponent {
  private readonly esg = inject(FrameworkEsgService);
  private readonly shell = inject(ShellStateService);
  private readonly toast = inject(ToastService);

  protected readonly tabsCategorias = TABS_CATEGORIAS;
  protected readonly tabActiva = signal('portada');

  protected readonly cargandoConfiguracion = signal(true);
  protected readonly cargandoPortada = signal(true);
  protected readonly cargandoCategorias = signal<Record<number, boolean>>({ 1: true, 2: true, 3: true, 4: true });

  protected readonly configuracion = signal<EsgConfiguracionModulo | null>(null);
  protected readonly portada = signal<EsgResumenPortadaFila[]>([]);
  protected readonly categorias = signal<Record<number, EsgResumenCategoria>>({});

  protected readonly filaSeleccionada = signal<EsgMetricaFila | null>(null);
  protected readonly modoEdicion = signal(false);
  protected readonly mostrarEditar = signal(false);
  protected readonly mostrarUsuarios = signal(false);

  /** Admin del Host O admin propio del módulo — controla la visibilidad de "Editar"/"Usuarios". */
  protected readonly esAdmin = computed(() => this.esg.esAdmin(this.configuracion()));
  protected readonly puedeEditarModulo = computed(() => this.configuracion()?.puedeEditar ?? false);

  protected readonly disableEditar = computed(() => this.filaSeleccionada()?.is_edit !== 1);
  /** Deshabilitado sin selección (igual que `disableDetMet=true` inicial del legado) O si la fila es un nodo de agrupación (`is_nod===1`). */
  protected readonly disableDetalle = computed(() => {
    const fila = this.filaSeleccionada();
    return !fila || fila.is_nod === 1;
  });

  protected readonly metricasPorCategoria = computed<Record<number, EsgMetricaListItem[]>>(() => {
    const resultado: Record<number, EsgMetricaListItem[]> = {};
    Object.entries(this.categorias()).forEach(([cod, resumen]) => {
      resultado[Number(cod)] = resumen.filas
        .filter((fila) => fila.is_nod !== 1)
        .map((fila) => ({ id: String(fila.cod_met), nombre: `${fila.des_met} (${fila.des_med})` }));
    });
    return resultado;
  });

  constructor() {
    this.cargarTodo();
  }

  protected columnasHistoricasDe(codCat: number): string[] {
    return this.categorias()[codCat]?.columnasHistoricas ?? [];
  }

  protected filasDe(codCat: number): EsgMetricaFila[] {
    return this.categorias()[codCat]?.filas ?? [];
  }

  protected onFilaSeleccionada(fila: EsgMetricaFila): void {
    this.filaSeleccionada.set(fila);
  }

  protected mostrarDialogoEditar(): void {
    this.modoEdicion.set(true);
    this.mostrarEditar.set(true);
  }

  protected mostrarDialogoDetalle(): void {
    this.modoEdicion.set(false);
    this.mostrarEditar.set(true);
  }

  protected mostrarDialogoUsuarios(): void {
    this.mostrarUsuarios.set(true);
  }

  protected onMetricaGuardada(): void {
    const fila = this.filaSeleccionada();
    if (fila) this.cargarCategoria(fila.cod_cat);
  }

  private cargarTodo(): void {
    this.esg.cargarConfiguracion().subscribe({
      next: (cfg) => {
        this.configuracion.set(cfg);
        this.cargandoConfiguracion.set(false);
      },
      error: () => {
        this.cargandoConfiguracion.set(false);
        this.toast.error('No se pudo cargar la configuración del módulo', 'Inténtalo de nuevo en unos segundos.');
      },
    });

    this.esg.cargarResumenPortada().subscribe({
      next: (filas) => {
        this.portada.set(filas);
        this.cargandoPortada.set(false);
      },
      error: () => {
        this.cargandoPortada.set(false);
        this.toast.error('No se pudo cargar el resumen de portada', 'Inténtalo de nuevo en unos segundos.');
      },
    });

    this.tabsCategorias.forEach((tab) => this.cargarCategoria(tab.codCat));
  }

  private cargarCategoria(codCat: number): void {
    this.cargandoCategorias.update((mapa) => ({ ...mapa, [codCat]: true }));
    this.esg.cargarResumenCategoria(codCat, this.shell.esAdmin()).subscribe({
      next: (resumen) => {
        this.categorias.update((mapa) => ({ ...mapa, [codCat]: resumen }));
        this.cargandoCategorias.update((mapa) => ({ ...mapa, [codCat]: false }));
      },
      error: () => {
        this.cargandoCategorias.update((mapa) => ({ ...mapa, [codCat]: false }));
        this.toast.error('No se pudo cargar la categoría', 'Inténtalo de nuevo en unos segundos.');
      },
    });
  }
}
