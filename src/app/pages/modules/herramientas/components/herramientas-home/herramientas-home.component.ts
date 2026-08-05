import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideShieldAlert } from '@ng-icons/lucide';
import { ButtonModule } from 'primeng/button';
import { BaseNegativaService } from '../../services/base-negativa.service';
import { ConsultaRiesgoDialogComponent } from '../../ui/consulta-riesgo-dialog/consulta-riesgo-dialog.component';
import { ResultadoTableComponent } from '../../ui/resultado-table/resultado-table.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import type { BaseNegativaBusquedaFila } from '../../models';

/**
 * "Consulta Base Negativa" (`/app/cons_base_negativa`, módulo Herramientas).
 *
 * Migrado de `basenegativa.component.ts` (legado STG,
 * `docs/07-modulos/basenegativa/`): al entrar, abre directo el buscador de
 * clientes; al elegir uno, muestra el detalle (venta/castigo) en esta misma
 * página; si cierran el buscador sin elegir, vuelve al dashboard — igual
 * que el legado navegaba a `app/desktop`.
 */
@Component({
  selector: 'app-herramientas-home',
  standalone: true,
  imports: [NgIconComponent, ButtonModule, ConsultaRiesgoDialogComponent, ResultadoTableComponent, InlineErrorComponent, EmptyStateComponent],
  viewProviders: [provideIcons({ lucideShieldAlert })],
  templateUrl: './herramientas-home.component.html',
  styleUrl: './herramientas-home.component.css',
})
export class HerramientasHomeComponent implements OnInit, OnDestroy {
  protected readonly service = inject(BaseNegativaService);
  private readonly router = inject(Router);

  protected readonly mostrarBuscador = signal(false);
  protected readonly clienteActual = signal<BaseNegativaBusquedaFila | null>(null);

  ngOnInit(): void {
    this.mostrarBuscador.set(true);
  }

  ngOnDestroy(): void {
    this.service.limpiar();
  }

  protected onClienteSeleccionado(cliente: BaseNegativaBusquedaFila): void {
    this.clienteActual.set(cliente);
    this.service.consultar(cliente.HCTACLI);
  }

  protected onBuscadorVisibleChange(visible: boolean): void {
    this.mostrarBuscador.set(visible);
    // Se cerró el buscador sin elegir ningún cliente — igual que el legado, vuelve al dashboard.
    if (!visible && !this.clienteActual()) {
      this.router.navigateByUrl('/app/dashboard');
    }
  }

  protected nuevaBusqueda(): void {
    this.clienteActual.set(null);
    this.service.limpiar();
    this.mostrarBuscador.set(true);
  }
}
