import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';

import { APP_ROUTES } from './app.routes';
import { MisTheme } from './core/design-system/mis-theme';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './pages/full-pages/auth/service/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // Modo Zoneless obligatorio (sin zone.js)
    provideZonelessChangeDetection(),

    // Router con binding de @Input desde parámetros de ruta
    provideRouter(APP_ROUTES, withComponentInputBinding()),

    // HttpClient con interceptores y Fetch API nativa (compatible con Zoneless)
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),

    // Restaura la sesión persistida (sessionStorage) antes de renderizar,
    // para que authGuard no expulse al usuario al refrescar la página.
    provideAppInitializer(() => inject(AuthService).restaurarSesion()),


    // Animaciones async (requerido por PrimeNG)
    provideAnimationsAsync(),

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

