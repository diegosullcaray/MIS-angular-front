import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { SelectorSectoristaDialogComponent } from '../../ui/selector-sectorista-dialog/selector-sectorista-dialog.component';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { CategorizacionService } from '../../services/categorizacion.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import type { ComisionTarjeta, PerfilColaborador, RequisitoTarjeta } from '../../models/dashboard.model';
import type { NodoJerarquiaAncla, SectoristaItem } from '../../models/colaborador.model';

/** Categorización (`/app/analista/categorizacion`) — tablero de un colaborador: perfil, estado de 4 requisitos y resultados de comisión de 6 periodos. */
@Component({
  selector: 'app-categorizacion-dashboard',
  standalone: true,
  imports: [
    TooltipModule,
    ListSkeletonComponent,
    InlineErrorComponent,
    EmptyStateComponent,
    SelectorSectoristaDialogComponent,
    WindowPanelComponent,
  ],
  templateUrl: './categorizacion-dashboard.component.html',
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
  /** Colaborador en pantalla; es signal porque la barra de la ventana decide
      con él si el botón "Actualizar" tiene algo que recargar. */
  protected readonly codBtActual = signal<string | null>(null);

  constructor() {
    // Carga los sectoristas cuando el diálogo esté abierto Y el ancla resuelta: intentarlo una sola vez al abrir dejaba el diálogo vacío para siempre.
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
    const codBt = this.codBtActual();
    if (codBt) this.cargar(codBt);
  }

  private cargar(codBt: string): void {
    this.codBtActual.set(codBt);
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
