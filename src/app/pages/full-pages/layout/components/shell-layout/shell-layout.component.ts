import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { RedirectOverlayComponent } from '../../../../../shared/ui/redirect-overlay/redirect-overlay.component';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, RedirectOverlayComponent],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.css',
})
export class ShellLayoutComponent {}
