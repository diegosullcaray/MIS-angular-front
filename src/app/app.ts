import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ShellStateService } from './core/services/shell-state.service';
import { LoadSpinnerComponent } from './pages/full-pages/auth/components/load-spinner/load-spinner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule, LoadSpinnerComponent],
  template: `
    <router-outlet />
    <p-toast position="top-right" />
    @if (shell.cerrandoSesion()) {
      <app-load-spinner mensaje="Cerrando sesión…" />
    }
  `,
})
export class App {
  protected readonly shell = inject(ShellStateService);
}
