import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { RedirectOverlayComponent } from '../../../../../shared/ui/redirect-overlay/redirect-overlay.component';
import { ShellStateService } from '../../../../../core/services/shell-state.service';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, RedirectOverlayComponent, ProgressSpinnerModule],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.css',
})
export class ShellLayoutComponent {
  protected readonly shell = inject(ShellStateService);
}
