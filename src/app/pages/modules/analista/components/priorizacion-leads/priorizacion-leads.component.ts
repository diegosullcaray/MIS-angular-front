import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
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

  protected readonly esAdmin = computed(() => this.analista.esAdmin());
  protected readonly colaborador = this.analista.colaboradorActivo;

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filas = signal<FilaLead[]>([]);

  protected readonly dialogColaboradorAbierto = signal(false);
  protected readonly colaboradores = signal<ColaboradorItem[]>([]);
  protected readonly cargandoColaboradores = signal(false);

  private ancla: NodoJerarquiaAncla | null = null;

  constructor() {
    effect(() => {
      const c = this.colaborador();
      if (c) untracked(() => this.cargar(c.codBt));
    });
  }

  ngOnInit(): void {
    if (this.esAdmin()) {
      this.analista.obtenerAnclaAdmin().subscribe((ancla) => (this.ancla = ancla));
    } else {
      this.analista.usarColaboradorPropio();
    }
  }

  protected abrirSelectorColaborador(): void {
    this.dialogColaboradorAbierto.set(true);
    if (this.colaboradores().length > 0 || !this.ancla) return;

    this.cargandoColaboradores.set(true);
    this.analista.obtenerColaboradores(this.ancla.tip_cod, this.ancla.cod_rel).subscribe({
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
