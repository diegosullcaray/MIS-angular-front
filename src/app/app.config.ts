import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import { provideOAuthClient } from 'angular-oauth2-oidc';

import { APP_ROUTES } from './app.routes';
import { MisTheme } from './theme/mis-theme';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { AuthService } from './pages/full-pages/auth/service/auth.service';
import { ThemeService } from './shared/services/theme.service';
import { FUENTE_BUSQUEDA } from './shared/ui/buscador/fuente-busqueda';
import { FuenteNavegacionService } from './pages/full-pages/layout/services/fuente-navegacion.service';
import { FuenteDashboardsService } from './pages/modules/dashboard/services/fuente-dashboards.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // Modo Zoneless obligatorio (sin zone.js)
    provideZonelessChangeDetection(),

    // Router con binding de @Input desde parámetros de ruta
    provideRouter(APP_ROUTES, withComponentInputBinding()),

    // HttpClient con interceptores y Fetch API nativa (compatible con Zoneless)
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, httpErrorInterceptor, loadingInterceptor])),

    // Cliente OAuth (Google Sign-In) usado por AuthService
    provideOAuthClient(),

    // Restaura la sesión persistida (sessionStorage) antes de renderizar,
    // para que authGuard no expulse al usuario al refrescar la página.
    provideAppInitializer(() => inject(AuthService).restaurarSesion()),

    // Aplica el tema guardado antes del primer render (evita el parpadeo claro).
    provideAppInitializer(() => void inject(ThemeService)),

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

    // Fuentes del buscador: sumar un módulo es agregar acá su `FuenteBusqueda`.
    { provide: FUENTE_BUSQUEDA, useExisting: FuenteNavegacionService, multi: true },
    { provide: FUENTE_BUSQUEDA, useExisting: FuenteDashboardsService, multi: true },

    // PWA: cachea el app-shell (JS/CSS/íconos) para carga instantánea e
    // instalación en el dispositivo. Nunca cachea respuestas del backend
    // Ant/Winder (ver ngsw-config.json) — los datos financieros siempre se
    // piden en vivo. Deshabilitado en desarrollo (isDevMode) para no pelear
    // con el ciclo normal de recarga de `ng serve`.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
