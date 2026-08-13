import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { RedirectOverlayComponent } from '../../../../../shared/ui/redirect-overlay/redirect-overlay.component';
import { LoadingOverlayComponent } from '../../../../../shared/ui/loading-overlay/loading-overlay.component';
import { ShellStateService } from '../../../../../core/services/shell-state.service';

import { PanelNeutroComponent } from '../panel-neutro/panel-neutro.component';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    RedirectOverlayComponent,
    LoadingOverlayComponent,
    ProgressSpinnerModule,
    PanelNeutroComponent,
  ],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.css',
})
export class ShellLayoutComponent {
  protected readonly shell = inject(ShellStateService);
}
