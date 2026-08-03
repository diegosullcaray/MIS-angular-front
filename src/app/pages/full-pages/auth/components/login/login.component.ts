import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../service/auth.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { LoadSpinnerComponent } from '../load-spinner/load-spinner.component';
import { ToastService } from '../../../../../shared/services/toast.service';
import { version } from '../../../../../../global';

/**
 * Login del Host — Google Sign-In + Winder.
 *
 * `/login` cumple doble función, igual que en STG: es la pantalla que
 * ofrece el botón "Continuar con Google" y también el `redirectUri` al que
 * Google devuelve al usuario tras autenticarse.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ButtonModule, LoadSpinnerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly shell = inject(ShellStateService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly appVersion = version;

  /**
   * `verificando`: revisando si venimos de un redirect de Google.
   * `inicial`: sin sesión de Google — se muestra el botón de acceso.
   * `cargando`: login OK — pantalla de carga branded antes de navegar.
   */
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
    // Mantiene visible la pantalla de carga branded al menos 5s antes de navegar.
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await this.router.navigate(['/admin/dashboard']);
  }
}
