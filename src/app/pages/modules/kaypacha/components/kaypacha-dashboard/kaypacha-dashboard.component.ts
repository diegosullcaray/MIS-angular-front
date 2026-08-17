import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { NgStyle } from '@angular/common';
import { KaypachaDashboardService } from '../../services/kaypacha-dashboard.service';
import { KaypachaTourService } from '../../services/kaypacha-tour.service';
import { BuscadorColaboradorDialogComponent } from '../../ui/buscador-colaborador-dialog/buscador-colaborador-dialog.component';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import type { KaypachaColaboradorItem } from '../../models/kaypacha-colaborador.model';

/** Componente principal del tablero Kaypacha. */
@Component({
  selector: 'app-kaypacha-dashboard',
  standalone: true,
  imports: [
    TableModule,
    ButtonModule,
    TooltipModule,
    TagModule,
    CardModule,
    InputTextModule,
    NgStyle,
    ListSkeletonComponent,
    InlineErrorComponent,
    WindowPanelComponent,
    BuscadorColaboradorDialogComponent,
  ],
  templateUrl: './kaypacha-dashboard.component.html',
  styleUrl: './kaypacha-dashboard.component.css',
})
export class KaypachaDashboardComponent implements OnInit, OnDestroy {
  protected readonly service = inject(KaypachaDashboardService);
  protected readonly tourService = inject(KaypachaTourService);

  protected readonly mostrarDialogBuscador = signal(false);

  ngOnInit(): void {
    this.service.cargarDatos();
  }

  ngOnDestroy(): void {
    this.service.limpiar();
  }

  protected abrirBuscador(): void {
    this.service.cargarListaColaboradores();
    this.mostrarDialogBuscador.set(true);
  }

  protected onColaboradorSeleccionado(colaborador: KaypachaColaboradorItem): void {
    this.service.cargarDatos(colaborador.cod_bt);
  }

  protected limpiarTodo(): void {
    this.service.limpiar();
    this.service.cargarDatos();
  }

  protected iniciarTour(): void {
    this.tourService.iniciarTourGuiado();
  }

  protected get imagenMedalla(): string {
    const posNum = Number(this.service.posicion());
    if (!isNaN(posNum) && posNum > 0 && posNum <= 20) {
      return 'assets/images/fc/modules/kaypacha/PlataformaMIS2.png';
    }
    return 'assets/images/fc/modules/kaypacha/PlataformaMIS1.png';
  }
}
