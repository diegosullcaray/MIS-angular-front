import { Component, effect, inject, signal } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { IncentivosService } from '../../services/incentivos.service';
import { PerfilCardComponent } from '../../ui/perfil-card/perfil-card.component';
import { AvancesGridComponent } from '../../ui/avances-grid/avances-grid.component';
import { SuperPlusGridComponent } from '../../ui/super-plus-grid/super-plus-grid.component';
import { TablaVariablesComponent } from '../../ui/tabla-variables/tabla-variables.component';
import { SelectorNivelDialogComponent } from '../../ui/selector-nivel-dialog/selector-nivel-dialog.component';
import { CalculadoraDialogComponent } from '../../ui/calculadora-dialog/calculadora-dialog.component';
import { DetalleVariableDialogComponent } from '../../ui/detalle-variable-dialog/detalle-variable-dialog.component';
import { DetalleBancarizacionDialogComponent } from '../../ui/detalle-bancarizacion-dialog/detalle-bancarizacion-dialog.component';
import type { DetalleVariableActivo, ReqDetalleVariable } from '../../models/incentivos-detalle.model';
import type { DetalleAvanceEvent, DetalleSuperPlusEvent, DetalleTablaVariableEvent } from '../../models/incentivos-eventos.model';

/** Cuadro de Mando principal del módulo Incentivos. */
@Component({
  selector: 'app-incentivos-principal',
  standalone: true,
  imports: [
    SkeletonModule,
    PerfilCardComponent,
    AvancesGridComponent,
    SuperPlusGridComponent,
    TablaVariablesComponent,
    SelectorNivelDialogComponent,
    CalculadoraDialogComponent,
    DetalleVariableDialogComponent,
    DetalleBancarizacionDialogComponent,
    WindowPanelComponent,
  ],
  templateUrl: './principal.component.html',
})
export class PrincipalComponent {
  protected readonly incentivos = inject(IncentivosService);

  protected readonly mostrarSelector = signal(false);
  protected readonly mostrarCalculadora = signal(false);
  protected readonly mostrarDetalleVariable = signal(false);
  protected readonly mostrarDetalleBancarizacion = signal(false);
  protected readonly detalleActivo = signal<DetalleVariableActivo | null>(null);

  constructor() {
    this.incentivos.iniciar();

    effect(() => {
      if (this.incentivos.requiereSeleccionInicial()) this.mostrarSelector.set(true);
    });
  }

  protected abrirSelector(): void {
    this.mostrarSelector.set(true);
  }

  protected actualizar(): void {
    this.incentivos.actualizar();
  }

  protected abrirCalculadora(): void {
    this.mostrarCalculadora.set(true);
  }

  protected abrirDetalleTabla(evento: DetalleTablaVariableEvent): void {
    this.detalleActivo.set({ titulo: evento.titulo, icono: evento.icono, req: 'getDetail', codVar: evento.codVar, card: true });
    this.mostrarDetalleVariable.set(true);
  }

  protected abrirDetalleAvance(evento: DetalleAvanceEvent): void {
    this.detalleActivo.set({ titulo: evento.item.des, icono: evento.item.icono, req: 'getDetail', codVar: evento.codVar, card: true });
    this.mostrarDetalleVariable.set(true);
  }

  protected abrirDetalleSuperPlus(evento: DetalleSuperPlusEvent): void {
    const parametros = evento.item.parametros;
    if (parametros.comp === 2) {
      this.mostrarDetalleBancarizacion.set(true);
      return;
    }
    this.detalleActivo.set({
      titulo: evento.item.des,
      icono: evento.item.icono,
      req: parametros.req as ReqDetalleVariable,
      codVar: evento.codVar,
      card: parametros.card,
    });
    this.mostrarDetalleVariable.set(true);
  }
}
