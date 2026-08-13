import { Component, computed, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideWifiOff, lucideCircleAlert, lucideLock, lucideShieldAlert,
  lucideCompass, lucideTimer, lucideServerCrash, lucideArrowLeft,
  lucideHome, lucideRefreshCw, lucideLogIn,
} from '@ng-icons/lucide';
import { HttpErrorService } from '../../services/http-error.service';
import type { HttpErrorAction } from '../../models/http-error.model';
import { ButtonModule } from 'primeng/button';

/**
 * Página de error genérica.
 * Resuelve y muestra información según el código HTTP recibido en la ruta (ej: /error/404).
 */
@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [RouterLink, NgIconComponent, ButtonModule],
  viewProviders: [provideIcons({
    lucideWifiOff, lucideCircleAlert, lucideLock, lucideShieldAlert,
    lucideCompass, lucideTimer, lucideServerCrash, lucideArrowLeft,
    lucideHome, lucideRefreshCw, lucideLogIn,
  })],
  templateUrl: './error-page.component.html',
  styleUrl: './error-page.component.css',
})
export class ErrorPageComponent {
  private readonly httpErrorService = inject(HttpErrorService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  /** Código HTTP inyectado por el router (requiere withComponentInputBinding). */
  readonly code = input<string>('500');

  protected readonly info = computed(() => this.httpErrorService.resolver(Number(this.code())));

  protected readonly accionIcono: Record<HttpErrorAction, string> = {
    retry: 'lucideRefreshCw',
    login: 'lucideLogIn',
    home: 'lucideHome',
    back: 'lucideArrowLeft',
  };

  protected readonly accionLabel: Record<HttpErrorAction, string> = {
    retry: 'Reintentar',
    login: 'Ir a iniciar sesión',
    home: 'Volver a Mi espacio',
    back: 'Volver atrás',
  };

  protected ejecutarAccion(): void {
    const acciones: Record<HttpErrorAction, () => void> = {
      retry: () => window.location.reload(),
      login: () => this.router.navigateByUrl('/login'),
      home:  () => this.router.navigateByUrl('/app/dashboard'),
      back:  () => this.location.back(),
    };

    acciones[this.info().accion]?.();
  }
}