import { Component, inject, signal } from '@angular/core';
import { form, FormField, required, email } from '@angular/forms/signals';
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

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.loginForm().invalid()) return;

    this.cargando.set(true);
    this.errorMsg.set(null);

    const { email, password } = this.loginModel();

    // Simular retraso de validación de red
    setTimeout(() => {
      let mockUser = null;

      // Cuentas demo preconfiguradas
      if (email === 'admin@confianza.pe' && password === 'admin123') {
        mockUser = {
          id: 'usr-001',
          nombre: 'Diego Sullcarayra',
          email: 'admin@confianza.pe',
          rol: 'admin-sistema' as const,
          subsistemas: ['subsistema-contabilidad', 'subsistema-rrhh', 'subsistema-ventas'],
        };
      } else if (email === 'general@confianza.pe' && password === 'general123') {
        mockUser = {
          id: 'usr-002',
          nombre: 'Ana García',
          email: 'general@confianza.pe',
          rol: 'admin-general' as const,
          subsistemas: ['subsistema-contabilidad', 'subsistema-rrhh'],
        };
      } else if (email === 'supervisor@confianza.pe' && password === 'supervisor123') {
        mockUser = {
          id: 'usr-003',
          nombre: 'Carlos Mendoza',
          email: 'supervisor@confianza.pe',
          rol: 'supervisor-area' as const,
          subsistemas: ['subsistema-rrhh'],
        };
      }

      if (mockUser) {
        this.shell.setUsuarioActivo(mockUser);
        this.shell.setSidebarIconActivo('host-inicio');
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.errorMsg.set('Correo electrónico o contraseña incorrectos.');
      }
      this.cargando.set(false);
    }, 800);
  }
}
