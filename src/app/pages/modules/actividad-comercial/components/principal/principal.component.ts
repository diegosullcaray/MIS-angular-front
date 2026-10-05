import { Component } from '@angular/core';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';

/** Pantalla de Actividad Comercial. Por ahora solo enruta: sin consultas al backend (el ítem llega por `list_sec`). */
@Component({
  selector: 'app-actividad-comercial-principal',
  standalone: true,
  imports: [WindowPanelComponent, EmptyStateComponent],
  templateUrl: './principal.component.html',
})
export class PrincipalComponent {}
