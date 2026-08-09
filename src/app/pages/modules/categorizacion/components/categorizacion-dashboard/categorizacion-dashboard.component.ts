import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { SelectorSectoristaDialogComponent } from '../../ui/selector-sectorista-dialog/selector-sectorista-dialog.component';
import { CategorizacionService } from '../../services/categorizacion.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import type { ComisionTarjeta, NodoJerarquiaAncla, PerfilColaborador, RequisitoTarjeta, SectoristaItem } from '../../models';

/**
 * Categorización (`/app/analista/categorizacion`) — migrado de
 * `CategorizacionComponent` (legado STG, `docs/07-modulos/analista/categorizacion`).
 * Tablero de un colaborador: perfil, estado de 4 requisitos y resultados de
 * comisión de 6 periodos.
 *
 * Un colaborador ve su propia categorización directo al entrar; un
 * admin/supervisor (`esAdmin`) primero elige a qué colaborador ver desde un
 * selector de sectoristas (el legado lo resolvía con `hier-rem-selector` +
 * `SecPickerDialog2`, ninguno incluido en el volcado de referencia — acá se
 * reconstruye con la misma jerarquía `base_hier`/`list_pick_01` que ya usa
 * el resto del Host).
 */
@Component({
  selector: 'app-categorizacion-dashboard',
  standalone: true,
  imports: [ButtonModule, ListSkeletonComponent, InlineErrorComponent, EmptyStateComponent, SelectorSectoristaDialogComponent],
  templateUrl: './categorizacion-dashboard.component.html',
  styleUrl: './categorizacion-dashboard.component.css',
})
export class CategorizacionDashboardComponent implements OnInit {
  private readonly categorizacion = inject(CategorizacionService);
  private readonly shell = inject(ShellStateService);

  protected readonly esAdmin = computed(() => this.categorizacion.esAdmin());

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly perfil = signal<PerfilColaborador | null>(null);
  protected readonly requisitos = signal<RequisitoTarjeta[]>([]);
  protected readonly comisiones = signal<ComisionTarjeta[]>([]);

  protected readonly dialogAbierto = signal(false);
  protected readonly sectoristas = signal<SectoristaItem[]>([]);
  protected readonly cargandoSectoristas = signal(false);

  private readonly ancla = signal<NodoJerarquiaAncla | null>(null);
  private readonly cargandoAncla = signal(false);
  private codBtActual: string | null = null;

  constructor() {
    // Dispara la carga de sectoristas en cuanto el diálogo esté abierto Y el
    // nodo ancla haya terminado de resolverse — antes se intentaba una sola
    // vez al abrir el diálogo (`abrirSelector`), así que si el admin hacía
    // click antes de que `obtenerAnclaAdmin()` respondiera, el diálogo
    // quedaba vacío para siempre (sin spinner ni reintento).
    effect(() => {
      const abierto = this.dialogAbierto();
      if (!abierto || this.sectoristas().length > 0) return;
      if (this.cargandoAncla()) return;

      const ancla = this.ancla();
      if (!ancla) {
        untracked(() => this.cargandoSectoristas.set(false));
        return;
      }
      untracked(() => this.cargarSectoristas(ancla));
    });
  }

  ngOnInit(): void {
    if (this.esAdmin()) {
      // Solo prepara el nodo ancla — igual que el legado (`showSecPickerDialog(false)`),
      // no carga datos hasta que el admin elija un colaborador.
      this.cargandoAncla.set(true);
      this.categorizacion.obtenerAnclaAdmin().subscribe({
        next: (ancla) => {
          this.ancla.set(ancla);
          this.cargandoAncla.set(false);
        },
        error: () => this.cargandoAncla.set(false),
      });
      return;
    }

    const codBt = this.shell.usuarioActivo()?.codBt;
    if (codBt) this.cargar(codBt);
  }

  protected abrirSelector(): void {
    this.dialogAbierto.set(true);
    if (this.sectoristas().length === 0) this.cargandoSectoristas.set(true);
  }

  private cargarSectoristas(ancla: NodoJerarquiaAncla): void {
    this.categorizacion.obtenerSectoristas(ancla.tip_cod, ancla.cod_rel).subscribe({
      next: (lista) => {
        this.sectoristas.set(lista);
        this.cargandoSectoristas.set(false);
      },
      error: () => this.cargandoSectoristas.set(false),
    });
  }

  protected onSectoristaSeleccionado(item: SectoristaItem): void {
    this.cargar(item.cod_sec);
  }

  protected reintentar(): void {
    if (this.codBtActual) this.cargar(this.codBtActual);
  }

  private cargar(codBt: string): void {
    this.codBtActual = codBt;
    this.cargando.set(true);
    this.error.set(null);

    this.categorizacion.obtenerDetalle(codBt).subscribe({
      next: (detalle) => {
        if (!detalle) {
          this.error.set(`No se encontraron datos para el colaborador: ${codBt}`);
          this.perfil.set(null);
          this.requisitos.set([]);
          this.comisiones.set([]);
        } else {
          this.perfil.set(detalle.perfil);
          this.requisitos.set(detalle.requisitos);
          this.comisiones.set(detalle.comisiones);
        }
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la categorización. Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
