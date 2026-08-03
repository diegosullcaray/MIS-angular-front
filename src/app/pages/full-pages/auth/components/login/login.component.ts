import { Component, inject, signal } from '@angular/core';
import { form, FormField, required, email, applyWhen, submit } from '@angular/forms/signals';
import { AuthService } from '../../service/auth.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoadSpinnerComponent } from '../load-spinner/load-spinner.component';
import { ToastService } from '../../../../../shared/services/toast.service';
import { version } from '../../../../../../global';

/**
 * Login del Host — Integrado con Winder.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormField,
    InputTextModule,
    ButtonModule,
    LoadSpinnerComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly shell = inject(ShellStateService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected cargando = signal(false);
  protected readonly appVersion = version;

  protected paso = signal<'credenciales' | 'cargando'>('credenciales');

  protected loginModel = signal({ email: '' });

  protected loginForm = form(this.loginModel, (schema) => {
    applyWhen(schema.email, ({ stateOf }) => stateOf(schema.email).touched(), (emailField) => {
      required(emailField, { message: 'Introduce un correo electrónico válido.' });
      email(emailField, { message: 'Introduce un correo electrónico válido.' });
    });
  });

  constructor() {
    console.log(
      '%cCuentas demo de prueba:',
      'font-weight: bold;',
      '\nUsa un correo válido corporativo para STG.'
    );
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    await submit(this.loginForm, async () => {
      this.cargando.set(true);

      try {
        await this.auth.login({ email: this.loginModel().email });
        
        this.shell.setSidebarIconActivo('host-inicio');
        this.paso.set('cargando');
        // Mantiene visible la pantalla de carga branded al menos 5s antes de navegar.
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await this.router.navigate(['/admin/dashboard']);
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error de autenticación.';
        this.toast.error('No se pudo iniciar sesión', mensaje);
      } finally {
        this.cargando.set(false);
      }
    });
  }
}

