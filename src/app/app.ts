import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShellStateService } from './core/services/shell-state.service';
import { LoadSpinnerComponent } from './pages/full-pages/auth/components/load-spinner/load-spinner.component';
import { ToastComponent } from './shared/ui/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, LoadSpinnerComponent],
  template: `
    <router-outlet />
    <app-toast />
    @if (shell.cerrandoSesion()) {
      <app-load-spinner mensaje="Cerrando sesión…" />
    }
  `,
})
export class App {
  protected readonly shell = inject(ShellStateService);
}
