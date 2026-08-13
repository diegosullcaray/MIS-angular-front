import { Component, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideInfo } from '@ng-icons/lucide';

/** Diálogo informativo con los criterios de monitoreo de Destino de Crédito. */
@Component({
  selector: 'app-destino-credito-info-dialog',
  standalone: true,
  imports: [ButtonModule, DialogModule, TooltipModule, NgIconComponent],
  viewProviders: [provideIcons({ lucideInfo })],
  templateUrl: './destino-credito-info-dialog.component.html',
  styleUrl: './destino-credito-info-dialog.component.css',
})
export class DestinoCreditoInfoDialogComponent {
  protected readonly visible = signal(false);

  protected abrir(): void {
    this.visible.set(true);
  }

  protected cerrar(): void {
    this.visible.set(false);
  }
}
