import { Component, effect, inject, signal } from '@angular/core';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { ButtonModule } from 'primeng/button';
import { SelectorNivelTableroComponent } from '../../ui/selector-nivel-tablero/selector-nivel-tablero.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { HierSelectorComponent } from '../../../../../shared/ui/hier-selector/hier-selector.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../shared/services/toast.service';
import { PARAMS_HIER_TABLERO, TITULO_TABLERO } from '../../constantes/actividad-comercial.constantes';
import { ActividadComercialService, type NodoTablero } from '../../services/actividad-comercial.service';
import { TarjetaCarteraComponent } from '../../ui/tarjeta-cartera/tarjeta-cartera.component';
import { TarjetaClientesComponent } from '../../ui/tarjeta-clientes/tarjeta-clientes.component';
import { TarjetaDesembolsosComponent } from '../../ui/tarjeta-desembolsos/tarjeta-desembolsos.component';
import { TarjetaDigitalComponent } from '../../ui/tarjeta-digital/tarjeta-digital.component';
import { TarjetaMoraComponent } from '../../ui/tarjeta-mora/tarjeta-mora.component';
import { TarjetaSegurosComponent } from '../../ui/tarjeta-seguros/tarjeta-seguros.component';

/** Tablero de Seguimiento (Actividad Comercial). Contenedor: pide el tablero de la entidad elegida y reparte cada tarjeta. */
@Component({
  selector: 'app-actividad-comercial-principal',
  standalone: true,
  imports: [
    WindowPanelComponent,
    ButtonModule,
    SelectorNivelTableroComponent,
    HierSelectorComponent,
    EmptyStateComponent,
    InlineErrorComponent,
    ListSkeletonComponent,
    TarjetaCarteraComponent,
    TarjetaDesembolsosComponent,
    TarjetaMoraComponent,
    TarjetaClientesComponent,
    TarjetaDigitalComponent,
    TarjetaSegurosComponent,
  ],
  templateUrl: './principal.component.html',
})
export class PrincipalComponent {
  private readonly service = inject(ActividadComercialService);
  private readonly toast = inject(ToastService);

  /** El administrador elige el nivel; sin él, el selector no consulta la raíz por su cuenta. */
  protected readonly esAdmin = inject(ShellStateService).esAdmin;
  /** El administrador entra con el diálogo abierto: sin nivel no hay qué consultar. */
  protected readonly mostrarSelector = signal(inject(ShellStateService).esAdmin());

  protected readonly titulo = TITULO_TABLERO;
  protected readonly paramsHier = PARAMS_HIER_TABLERO;
  protected readonly nivelActual = signal<NodoTablero | null>(null);
  protected readonly tablero = this.service.tablero;
  protected readonly cargando = this.service.cargando;
  protected readonly error = this.service.error;
  protected readonly vacio = this.service.vacio;

  constructor() {
    effect(() => {
      const nodo = this.nivelActual();
      if (nodo) this.service.consultar(nodo);
    });
  }

  protected onNivelSeleccionado(nodo: NodoTablero): void {
    this.nivelActual.set(nodo);
  }

  /** Reemite el nivel actual para volver a consultar sin cambiar la selección. */
  protected consultar(): void {
    const nodo = this.nivelActual();
    if (nodo) this.nivelActual.set({ ...nodo });
  }

  protected onErrorJerarquia(): void {
    this.toast.error('No se pudo cargar la jerarquía', 'Inténtalo de nuevo en unos segundos.');
  }
}
