import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { RedirectOverlayComponent } from '../../../../../shared/ui/redirect-overlay/redirect-overlay.component';
import { LoadingOverlayComponent } from '../../../../../shared/ui/loading-overlay/loading-overlay.component';
import { ShellStateService } from '../../../../../core/services/shell-state.service';

import { ExploradorSistemaComponent } from '../explorador-sistema/explorador-sistema.component';
import { AnunciosDialogComponent } from '../dialogs/anuncios-dialog/anuncios-dialog.component';
import { AnunciosService } from '../../../../../core/preferencias/aplicacion/anuncios.service';

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
    ExploradorSistemaComponent,
    AnunciosDialogComponent,
  ],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.css',
})
export class ShellLayoutComponent {
  protected readonly shell = inject(ShellStateService);
  private readonly anuncios = inject(AnunciosService);

  constructor() {
    // El diálogo de anuncios se evalúa UNA vez, al entrar al shell con un
    // usuario ya autenticado — no en cada navegación. Y aun ahí solo se abre si
    // queda algo sin leer: es lo que corta el aviso repetido en cada ingreso.
    effect(() => {
      if (this.shell.usuarioActivo()) this.anuncios.abrirSiCorresponde();
    });
  }
}
