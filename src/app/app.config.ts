import {
  ApplicationConfig,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';

import { APP_ROUTES } from './app.routes';
import { MisTheme } from './core/design-system/mis-theme';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Modo Zoneless obligatorio (sin zone.js)
    provideZonelessChangeDetection(),

    // Router con binding de @Input desde parámetros de ruta
    provideRouter(APP_ROUTES, withComponentInputBinding()),

    // HttpClient con interceptores y Fetch API nativa (compatible con Zoneless)
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),


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
  ],
};

