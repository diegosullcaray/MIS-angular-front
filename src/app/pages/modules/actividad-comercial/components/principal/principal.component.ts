import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { ActividadComercialResumenCardComponent } from '../../ui/actividad-comercial-resumen-card/actividad-comercial-resumen-card.component';
import { ActividadComercialService } from '../../services/actividad-comercial.service';
import { ACTIVIDAD_COMERCIAL_FILAS_POR_PAGINA } from '../../constantes/actividad-comercial.constantes';

/** Pantalla principal de Actividad Comercial. Contenedor: orquesta el servicio y los estados. */
@Component({
  selector: 'app-actividad-comercial-principal',
  standalone: true,
  imports: [
    TableModule,
    WindowPanelComponent,
    TagModule,
    EmptyStateComponent,
    InlineErrorComponent,
    ListSkeletonComponent,
    ActividadComercialResumenCardComponent,
  ],
  templateUrl: './principal.component.html',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  private readonly service = inject(ActividadComercialService);

  protected readonly filas = this.service.filas;
  protected readonly cargando = this.service.cargando;
  protected readonly error = this.service.error;
  protected readonly vacio = this.service.vacio;
  protected readonly totalRegistros = this.service.totalRegistros;
  protected readonly totalMonto = this.service.totalMonto;
  protected readonly filasPorPagina = ACTIVIDAD_COMERCIAL_FILAS_POR_PAGINA;

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
