import { Component, inject, output } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideGrid, lucideUser, lucideShieldCheck, lucideArrowRight } from '@ng-icons/lucide';
import { ShellContractService } from '../../core/shell-contract/shell-contract.service';

/**
 * Vista de ejemplo 1: dashboard del subsistema.
 * Demuestra el patrón de vista del MIS (p-card + tokens --mis-*) y la
 * LECTURA del contrato de la shell (usuario activo, rol, acceso propio).
 * Reemplazar por las vistas reales del dominio al usar la plantilla.
 */
@Component({
  selector: 'remote-dashboard',
  standalone: true,
  imports: [CardModule, ButtonModule, NgIconComponent],
  viewProviders: [provideIcons({ lucideGrid, lucideUser, lucideShieldCheck, lucideArrowRight })],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  protected readonly shell = inject(ShellContractService);

  /** Navegación interna delegada al remote-root (dueño del estado de vista). */
  readonly irA = output<'ejemplo'>();
}
