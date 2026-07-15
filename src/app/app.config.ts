import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';

import { MisTheme } from './core/design-system/mis-theme';
import { authInterceptor } from './core/interceptors/auth.interceptor';

/**
 * Configuración del Remote — mismas obligaciones del TRD del Host:
 * Zoneless (sin zone.js), Fetch API, MisTheme sin ripple.
 *
 * Este appConfig solo aplica al arranque standalone (desarrollo aislado).
 * Embebido en el Host, el componente expuesto usa el injector del Host,
 * por lo que NO debe depender de providers exclusivos de este archivo.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Modo Zoneless obligatorio (sin zone.js)
    provideZonelessChangeDetection(),

    // Router vacío: la navegación de primer nivel es del Host (RN-01).
    // El remote puede leer la URL activa para decidir su vista inicial.
    provideRouter([], withComponentInputBinding()),

    // HttpClient con Fetch API — SOLO contra el backend propio del subsistema
    // (prefijo /api/<dominio>/v1/*), nunca contra las APIs del Host (RN-02).
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),

    // Animaciones async (requerido por PrimeNG)
    provideAnimationsAsync(),

    // PrimeNG con el MISMO preset del Host (PG-06): MisTheme, sin ripple
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
