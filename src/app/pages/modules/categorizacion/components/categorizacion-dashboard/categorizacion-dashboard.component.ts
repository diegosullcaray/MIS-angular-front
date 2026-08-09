import { Component, OnInit, computed, inject, signal } from '@angular/core';
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

  private ancla: NodoJerarquiaAncla | null = null;
  private codBtActual: string | null = null;

  ngOnInit(): void {
    if (this.esAdmin()) {
      // Solo prepara el nodo ancla — igual que el legado (`showSecPickerDialog(false)`),
      // no carga datos hasta que el admin elija un colaborador.
      this.categorizacion.obtenerAnclaAdmin().subscribe((ancla) => (this.ancla = ancla));
      return;
    }

    const codBt = this.shell.usuarioActivo()?.codBt;
    if (codBt) this.cargar(codBt);
  }

  protected abrirSelector(): void {
    this.dialogAbierto.set(true);
    if (this.sectoristas().length > 0 || !this.ancla) return;

    this.cargandoSectoristas.set(true);
    this.categorizacion.obtenerSectoristas(this.ancla.tip_cod, this.ancla.cod_rel).subscribe({
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
