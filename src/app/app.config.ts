import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import { provideOAuthClient } from 'angular-oauth2-oidc';

import { APP_ROUTES } from './app.routes';
import { MisTheme } from './theme/mis-theme';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { AuthService } from './pages/full-pages/auth/service/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // Modo Zoneless obligatorio (sin zone.js)
    provideZonelessChangeDetection(),

    // Router con binding de @Input desde parámetros de ruta
    provideRouter(APP_ROUTES, withComponentInputBinding()),

    // HttpClient con interceptores y Fetch API nativa (compatible con Zoneless)
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, httpErrorInterceptor])),

    // Cliente OAuth (Google Sign-In) usado por AuthService
    provideOAuthClient(),

    // Restaura la sesión persistida (sessionStorage) antes de renderizar,
    // para que authGuard no expulse al usuario al refrescar la página.
    provideAppInitializer(() => inject(AuthService).restaurarSesion()),

    // PrimeNG con tema personalizado macOS
    providePrimeNG({
      theme: {
        preset: MisTheme,
        options: {
          darkModeSelector: '.dark',
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng, utilities',
          },
        },
      },
      ripple: false, // Sin ripple — estilo macOS
    }),
    MessageService,
  ],
};
