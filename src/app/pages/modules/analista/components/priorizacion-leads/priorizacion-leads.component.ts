import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { SelectorColaboradorDialogComponent } from '../../ui/selector-colaborador-dialog/selector-colaborador-dialog.component';
import { AnalistaService } from '../../services/analista.service';
import type { ColaboradorItem, FilaLead, NodoJerarquiaAncla } from '../../models';

/**
 * Priorización de Leads (`/app/analista/listas/priorizacion-leads`) —
 * migrado de `PriorizacionLeadsComponent` (legado STG,
 * `docs/07-modulos/analista/listas/priorizacion-leads`), extendido de
 * `ListaBaseComponent`. Tabla de solo lectura con encabezado agrupado en
 * 3 niveles (Campaña / Cliente / Gestión).
 *
 * El legado exponía checkboxes "Ocultar Desembolsados" / "Ocultar en
 * Mora" (`checkFilters`), pero su lógica de filtrado estaba comentada y
 * nunca aplicaba nada — se omiten acá por ser funcionalidad muerta.
 */
@Component({
  selector: 'app-priorizacion-leads-analista',
  standalone: true,
  imports: [
    ButtonModule,
    TableModule,
    TooltipModule,
    ListSkeletonComponent,
    InlineErrorComponent,
    EmptyStateComponent,
    SelectorColaboradorDialogComponent,
  ],
  templateUrl: './priorizacion-leads.component.html',
  styleUrl: './priorizacion-leads.component.css',
})
export class PriorizacionLeadsComponent implements OnInit {
  private readonly analista = inject(AnalistaService);
  private readonly router = inject(Router);

  protected readonly esAdmin = computed(() => this.analista.esAdmin());
  protected readonly colaborador = this.analista.colaboradorActivo;

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filas = signal<FilaLead[]>([]);

  protected readonly dialogColaboradorAbierto = signal(false);
  protected readonly colaboradores = signal<ColaboradorItem[]>([]);
  protected readonly cargandoColaboradores = signal(false);

  private readonly ancla = signal<NodoJerarquiaAncla | null>(null);
  private readonly cargandoAncla = signal(false);

  constructor() {
    effect(() => {
      const c = this.colaborador();
      if (c) untracked(() => this.cargar(c.codBt));
    });

    // Dispara la carga de colaboradores en cuanto el diálogo esté abierto Y
    // el nodo ancla haya terminado de resolverse — antes se intentaba una
    // sola vez al abrir el diálogo (`abrirSelectorColaborador`), así que si
    // el admin hacía click antes de que `obtenerAnclaAdmin()` respondiera,
    // el diálogo quedaba vacío para siempre (sin spinner ni reintento).
    effect(() => {
      const abierto = this.dialogColaboradorAbierto();
      if (!abierto || this.colaboradores().length > 0) return;
      if (this.cargandoAncla()) return;

      const ancla = this.ancla();
      if (!ancla) {
        untracked(() => this.cargandoColaboradores.set(false));
        return;
      }
      untracked(() => this.cargarColaboradores(ancla));
    });
  }

  ngOnInit(): void {
    if (this.esAdmin()) {
      this.cargandoAncla.set(true);
      this.analista.obtenerAnclaAdmin().subscribe({
        next: (ancla) => {
          this.ancla.set(ancla);
          this.cargandoAncla.set(false);
        },
        error: () => this.cargandoAncla.set(false),
      });
    } else {
      this.analista.usarColaboradorPropio();
    }
  }

  protected volver(): void {
    this.router.navigate(['/app/analista/listas']);
  }

  protected abrirSelectorColaborador(): void {
    this.dialogColaboradorAbierto.set(true);
    if (this.colaboradores().length === 0) this.cargandoColaboradores.set(true);
  }

  private cargarColaboradores(ancla: NodoJerarquiaAncla): void {
    this.analista.obtenerColaboradores(ancla.tip_cod, ancla.cod_rel).subscribe({
      next: (lista) => {
        this.colaboradores.set(lista);
        this.cargandoColaboradores.set(false);
      },
      error: () => this.cargandoColaboradores.set(false),
    });
  }

  protected onColaboradorSeleccionado(item: ColaboradorItem): void {
    this.analista.establecerColaborador(item);
  }

  protected reintentar(): void {
    const c = this.colaborador();
    if (c) this.cargar(c.codBt);
  }

  private cargar(codBt: string): void {
    this.cargando.set(true);
    this.error.set(null);

    this.analista.obtenerListaPrioLeads(codBt).subscribe({
      next: (filas) => {
        this.filas.set(filas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de leads. Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
