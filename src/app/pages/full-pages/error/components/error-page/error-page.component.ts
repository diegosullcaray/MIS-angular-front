import { Component, computed, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideWifiOff, lucideCircleAlert, lucideLock, lucideShieldAlert,
  lucideCompass, lucideTimer, lucideServerCrash, lucideArrowLeft,
  lucideHome, lucideRefreshCw, lucideLogIn,
} from '@ng-icons/lucide';
import { HttpErrorService } from '../../../../../core/services/http-error.service';
import type { HttpErrorAction } from '../../../../../core/interfaces/http-error.model';

/**
 * Página de error genérica de fullpages — renderiza cualquier código HTTP
 * conocido (`http-error.constants.ts`) a partir del parámetro de ruta
 * `:code` (ver `app.routes.ts` → `error/:code`).
 *
 * `httpErrorInterceptor` navega aquí para errores fatales de infraestructura
 * (backend caído, timeout, sin red); también es alcanzable manualmente
 * (ej. un enlace "Reportar problema").
 */
@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [RouterLink, NgIconComponent],
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

  /** Código HTTP como string (route param, ver `withComponentInputBinding`). */
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
    switch (this.info().accion) {
      case 'retry':
        window.location.reload();
        break;
      case 'login':
        this.router.navigateByUrl('/login');
        break;
      case 'home':
        this.router.navigateByUrl('/app/dashboard');
        break;
      case 'back':
        this.location.back();
        break;
    }
  }
}
