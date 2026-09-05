import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../service/auth.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { LoadSpinnerComponent } from '../load-spinner/load-spinner.component';
import { ToastService } from '../../../../../shared/services/toast.service';
import { ThemeService } from '../../../../../shared/services/theme.service';
import { APP_VERSION } from '../../../../../app.global';

/** Login del Host — Google Sign-In + Winder. */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ButtonModule, LoadSpinnerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly shell = inject(ShellStateService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly theme = inject(ThemeService);

  protected readonly appVersion = APP_VERSION;

  protected readonly logoMis = computed(() =>
    this.theme.oscuro() ? 'assets/images/fc/logos/mis_white.png' : 'assets/images/fc/logos/mis.png'
  );

  /** `verificando`: revisando si venimos de un redirect de Google. */
  protected paso = signal<'verificando' | 'inicial' | 'cargando'>('verificando');

  async ngOnInit(): Promise<void> {
    try {
      const usuario = await this.auth.completarLoginGoogle();
      if (usuario) {
        await this.entrarAlDashboard();
        return;
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error de autenticación.';
      this.toast.error('No se pudo iniciar sesión', mensaje);
    }
    this.paso.set('inicial');
  }

  protected onGoogleLogin(): void {
    this.auth.iniciarLoginGoogle();
  }

  private async entrarAlDashboard(): Promise<void> {
    this.shell.setSidebarIconActivo('host-inicio');
    this.paso.set('cargando');
    // Mantiene visible la pantalla de carga branded al menos 3s antes de navegar.
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await this.router.navigate(['/app/dashboard']);
  }
}
