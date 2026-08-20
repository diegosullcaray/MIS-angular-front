import { Component, OnInit, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { SelectorColaboradorDialogComponent } from '../../ui/selector-colaborador-dialog/selector-colaborador-dialog.component';
import { AnalistaService } from '../../services/analista.service';
import { crearSelectorColaborador } from '../../utils/colaborador-selector.util';
import type { ColaboradorItem } from '../../models/colaborador.model';
import type { FilaLead } from '../../models/listas.model';

/** Priorización de Leads (`/app/analista/listas/priorizacion-leads`) — tabla de solo lectura con encabezado agrupado en 3 niveles (Campaña / Cliente / Gestión). */
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
    WindowPanelComponent,
  ],
  templateUrl: './priorizacion-leads.component.html',
  styleUrl: './priorizacion-leads.component.css',
})
export class PriorizacionLeadsComponent implements OnInit {
  private readonly analista = inject(AnalistaService);
  private readonly router = inject(Router);

  protected readonly selectorColaborador = crearSelectorColaborador(this.analista);
  protected readonly esAdmin = this.selectorColaborador.esAdmin;
  protected readonly colaborador = this.selectorColaborador.colaboradorActivo;
  protected readonly dialogColaboradorAbierto = this.selectorColaborador.dialogAbierto;
  protected readonly colaboradores = this.selectorColaborador.colaboradores;
  protected readonly cargandoColaboradores = this.selectorColaborador.cargando;

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filas = signal<FilaLead[]>([]);

  constructor() {
    effect(() => {
      const c = this.colaborador();
      if (c) untracked(() => this.cargar(c.codBt));
    });
  }

  ngOnInit(): void {
    this.selectorColaborador.inicializar();
  }

  protected volver(): void {
    this.router.navigate(['/app/analista/listas']);
  }

  protected abrirSelectorColaborador(): void {
    this.selectorColaborador.abrir();
  }

  protected onColaboradorSeleccionado(item: ColaboradorItem): void {
    this.selectorColaborador.seleccionar(item);
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
