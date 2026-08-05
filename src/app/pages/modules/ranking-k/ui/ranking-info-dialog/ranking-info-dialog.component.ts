import { Component, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideInfo, lucideCheckCircle2 } from '@ng-icons/lucide';

/**
 * Diálogo informativo con las bases y condiciones del ranking.
 * Se ubica en la cabecera de la vista de detalle del ranking junto al título.
 */
@Component({
  selector: 'app-ranking-info-dialog',
  standalone: true,
  imports: [ButtonModule, DialogModule, TooltipModule, NgIconComponent],
  viewProviders: [provideIcons({ lucideInfo, lucideCheckCircle2 })],
  templateUrl: './ranking-info-dialog.component.html',
  styleUrl: './ranking-info-dialog.component.css',
})
export class RankingInfoDialogComponent {
  protected readonly visible = signal(false);

  protected abrir(): void {
    this.visible.set(true);
  }

  protected cerrar(): void {
    this.visible.set(false);
  }
}
