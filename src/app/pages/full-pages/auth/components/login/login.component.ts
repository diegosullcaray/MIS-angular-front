import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { form, FormField, required, email } from '@angular/forms/signals';
import { AuthService } from '../../service/auth.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideMail, lucideAlertCircle, lucideInfo, lucideArrowLeft } from '@ng-icons/lucide';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

const OTP_LARGO = 6;
const OTP_EXPIRA_SEGUNDOS = 180;

/**
 * Login del Host en dos pasos (CA-07):
 *  1. `credenciales` — email + contraseña (Signal Forms).
 *  2. `mfa` — verificación OTP de 6 dígitos con expiración.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormField,
    CardModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    IconFieldModule,
    InputIconModule,
    NgIconComponent
  ],
  viewProviders: [provideIcons({
    lucideMail, lucideAlertCircle, lucideInfo, lucideArrowLeft
  })],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly shell = inject(ShellStateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected cargando = signal(false);
  protected errorMsg = signal<string | null>(null);

  // ─── Paso 1: credenciales ─────────────────────────────────────────────────

  protected paso = signal<'credenciales' | 'mfa'>('credenciales');

  protected loginModel = signal({ email: '', password: '' });

  protected loginForm = form(this.loginModel, (schema) => {
    required(schema.email, { message: 'Introduce un correo electrónico válido.' });
    email(schema.email, { message: 'Introduce un correo electrónico válido.' });
    required(schema.password, { message: 'La contraseña es requerida.' });
  });

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.loginForm().invalid()) return;

    this.cargando.set(true);
    this.errorMsg.set(null);

    try {
      // Paso 1: POST /api/v1/auth/login → desafío MFA (Fake API en desarrollo)
      const desafio = await this.auth.login(this.loginModel());
      this.emailDesafio.set(desafio.email);
      this.iniciarMfa();
    } catch (err) {
      this.errorMsg.set(err instanceof Error ? err.message : 'Error de autenticación.');
    } finally {
      this.cargando.set(false);
    }
  }

  // ─── Paso 2: verificación MFA (OTP de 6 dígitos) ──────────────────────────

  private readonly emailDesafio = signal('');
  protected readonly otpDigitos = signal<string[]>(Array(OTP_LARGO).fill(''));
  protected readonly segundosRestantes = signal(OTP_EXPIRA_SEGUNDOS);
  private timerId: ReturnType<typeof setInterval> | null = null;

  protected readonly otpCompleto = computed(
    () => this.otpDigitos().every(d => d !== '')
  );

  protected readonly otpExpirado = computed(() => this.segundosRestantes() <= 0);

  /** Email del desafío enmascarado: d***o@confianza.pe */
  protected readonly emailEnmascarado = computed(() => {
    const [usuario, dominio] = this.emailDesafio().split('@');
    if (!usuario || !dominio) return this.emailDesafio();
    const visible = usuario.length > 1
      ? `${usuario[0]}***${usuario[usuario.length - 1]}`
      : `${usuario[0]}***`;
    return `${visible}@${dominio}`;
  });

  protected readonly expiraEn = computed(() => {
    const total = Math.max(this.segundosRestantes(), 0);
    const min = Math.floor(total / 60).toString().padStart(2, '0');
    const seg = (total % 60).toString().padStart(2, '0');
    return `${min}:${seg}`;
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.detenerTimer());
  }

  private iniciarMfa(): void {
    this.otpDigitos.set(Array(OTP_LARGO).fill(''));
    this.segundosRestantes.set(OTP_EXPIRA_SEGUNDOS);
    this.errorMsg.set(null);
    this.paso.set('mfa');

    this.detenerTimer();
    this.timerId = setInterval(() => {
      this.segundosRestantes.update(s => s - 1);
      if (this.segundosRestantes() <= 0) {
        this.detenerTimer();
        this.errorMsg.set('El código expiró. Vuelve a iniciar sesión para recibir uno nuevo.');
      }
    }, 1000);
  }

  protected onOtpInput(indice: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value.replace(/\D/g, '');

    // Pegar el código completo en cualquier celda
    if (valor.length > 1) {
      const digitos = Array(OTP_LARGO).fill('');
      valor.slice(0, OTP_LARGO).split('').forEach((d, i) => (digitos[i] = d));
      this.otpDigitos.set(digitos);
      this.enfocarCelda(Math.min(valor.length, OTP_LARGO) - 1, input);
      return;
    }

    input.value = valor;
    this.otpDigitos.update(digitos => {
      const copia = [...digitos];
      copia[indice] = valor;
      return copia;
    });

    if (valor && indice < OTP_LARGO - 1) {
      this.enfocarCelda(indice + 1, input);
    }
  }

  protected onOtpBackspace(indice: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value === '' && indice > 0) {
      this.enfocarCelda(indice - 1, input);
    }
  }

  private enfocarCelda(indice: number, desde: HTMLInputElement): void {
    const celdas = desde.closest('.otp-grid')?.querySelectorAll<HTMLInputElement>('input');
    celdas?.[indice]?.focus();
    celdas?.[indice]?.select();
  }

  protected async onVerificarOtp(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.otpCompleto() || this.otpExpirado()) return;

    this.cargando.set(true);
    this.errorMsg.set(null);

    try {
      // Paso 2: POST /api/v1/auth/verificar-otp → sesión emitida
      await this.auth.verificarOtp(this.otpDigitos().join(''));
      this.detenerTimer();
      this.shell.setSidebarIconActivo('host-inicio');
      this.router.navigate(['/inicio/dashboard']);
    } catch (err) {
      this.errorMsg.set(err instanceof Error ? err.message : 'Error de verificación.');
      this.otpDigitos.set(Array(OTP_LARGO).fill(''));
    } finally {
      this.cargando.set(false);
    }
  }

  protected volverALogin(): void {
    this.detenerTimer();
    this.auth.cancelarMfa();
    this.errorMsg.set(null);
    this.paso.set('credenciales');
  }

  private detenerTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
