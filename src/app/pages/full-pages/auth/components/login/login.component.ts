import { Component, inject, signal } from '@angular/core';
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
import { lucideMail, lucideAlertCircle } from '@ng-icons/lucide';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
    lucideMail, lucideAlertCircle
  })],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly shell = inject(ShellStateService);
  private readonly router = inject(Router);

  protected cargando = signal(false);
  protected errorMsg = signal<string | null>(null);

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
      // Autenticación vía POST /api/v1/auth/login (Fake API en desarrollo)
      await this.auth.login(this.loginModel());
      this.shell.setSidebarIconActivo('host-inicio');
      this.router.navigate(['/admin/dashboard']);
    } catch (err) {
      this.errorMsg.set(err instanceof Error ? err.message : 'Error de autenticación.');
    } finally {
      this.cargando.set(false);
    }
  }
}
