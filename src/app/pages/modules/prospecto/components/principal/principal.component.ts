import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { TagModule } from 'primeng/tag';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { ProspectoResumenCardComponent } from '../../ui/prospecto-resumen-card/prospecto-resumen-card.component';
import { ProspectoService } from '../../services/prospecto.service';
import { PROSPECTO_FILAS_POR_PAGINA } from '../../constantes/prospecto.constantes';

/** Pantalla principal de Prospecto. Contenedor: orquesta el servicio y los estados. */
@Component({
  selector: 'app-prospecto-principal',
  standalone: true,
  imports: [
    TableModule,
    WindowPanelComponent,
    TagModule,
    EmptyStateComponent,
    InlineErrorComponent,
    ListSkeletonComponent,
    ProspectoResumenCardComponent,
  ],
  templateUrl: './principal.component.html',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  private readonly service = inject(ProspectoService);

  protected readonly filas = this.service.filas;
  protected readonly cargando = this.service.cargando;
  protected readonly error = this.service.error;
  protected readonly vacio = this.service.vacio;
  protected readonly totalRegistros = this.service.totalRegistros;
  protected readonly filasPorPagina = PROSPECTO_FILAS_POR_PAGINA;

  ngOnInit(): void {
    this.consultar();
  }

  ngOnDestroy(): void {
    this.service.limpiar();
  }

  protected consultar(): void {
    this.service.consultar();
  }
}
