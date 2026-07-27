import { Component, inject, signal } from '@angular/core';
import { form, FormField, required, email, applyWhen, submit } from '@angular/forms/signals';
import { AuthService } from '../../service/auth.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoadSpinnerComponent } from '../load-spinner/load-spinner.component';
import { ToastService } from '../../../../../shared/services/toast.service';
import { version } from '../../../../../../global';

// MFA deshabilitado temporalmente (no se usará por ahora): en vez de mostrar el
// paso de verificación OTP, se completa el desafío con el código demo de la
// Fake API. AuthService.verificarOtp() y el contrato del backend (CA-07) no se
// tocaron — reactivar el paso de UI es cuestión de volver a llamarlo desde aquí.
const OTP_DEMO_TEMPORAL = '123456';

/**
 * Login del Host (CA-07 — MFA temporalmente deshabilitado en el flujo de UI).
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormField,
    InputTextModule,
    ButtonModule,
    PasswordModule,
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

  protected loginModel = signal({ email: '', password: '' });

  protected loginForm = form(this.loginModel, (schema) => {
    // applyWhen gatea la validación al campo ya tocado: recién entonces empieza
    // a evaluarse como inválido — antes de eso no hay nada que mostrar en warn.
    // `submit()` marca todos los campos como touched antes de ejecutar la acción,
    // así que al hacer clic en "Acceder" con campos vacíos, se activan al instante.
    applyWhen(schema.email, ({ stateOf }) => stateOf(schema.email).touched(), (emailField) => {
      required(emailField, { message: 'Introduce un correo electrónico válido.' });
      email(emailField, { message: 'Introduce un correo electrónico válido.' });
    });
    applyWhen(schema.password, ({ stateOf }) => stateOf(schema.password).touched(), (passwordField) => {
      required(passwordField, { message: 'La contraseña es requerida.' });
    });
  });

  constructor() {
    console.log(
      '%cCuentas demo de prueba:',
      'font-weight: bold;',
      '\nAdmin Sistema: admin@confianza.pe / admin123' +
      '\nAdmin General: general@confianza.pe / general123' +
      '\nSupervisor:    supervisor@confianza.pe / supervisor123'
    );
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    await submit(this.loginForm, async () => {
      this.cargando.set(true);

      try {
        // Paso 1: POST /api/v1/auth/login → desafío MFA (Fake API en desarrollo)
        await this.auth.login(this.loginModel());
        // MFA temporalmente omitido: completa el desafío con el código demo
        // en vez de pedirlo en pantalla (ver nota de OTP_DEMO_TEMPORAL arriba).
        await this.auth.verificarOtp(OTP_DEMO_TEMPORAL);
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
