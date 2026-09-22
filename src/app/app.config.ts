import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
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
import { PreferenciasService } from './pages/full-pages/layout/services/preferencias.service';
import { REPOSITORIO_PREFERENCIAS } from './pages/full-pages/layout/interfaces/preferencias-almacen.model';
import { PreferenciasLocalStorageRepositorio } from './pages/full-pages/layout/services/preferencias-local-storage.service';
import { CATALOGO_ANUNCIOS } from './pages/full-pages/layout/interfaces/anuncio.model';
import { ANUNCIOS_DEL_SISTEMA } from './pages/full-pages/layout/constantes/anuncios.constantes';
import { FUENTE_BUSQUEDA } from './shared/ui/buscador/fuente-busqueda';
import { FuenteNavegacionService } from './pages/full-pages/layout/services/fuente-navegacion.service';
import { FuenteDashboardsService } from './pages/modules/dashboard/services/fuente-dashboards.service';
import { RecientesService } from './pages/modules/home/services/recientes.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // Zoneless: sin zone.js
    provideZonelessChangeDetection(),

    // `onSameUrlNavigation: 'reload'` evita que volver a la misma ruta congele la pantalla.
    provideRouter(APP_ROUTES, withComponentInputBinding(), withRouterConfig({ onSameUrlNavigation: 'reload' })),

    // Fetch API nativa (compatible con Zoneless)
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, httpErrorInterceptor, loadingInterceptor])),

    // Cliente OAuth (Google Sign-In) usado por AuthService
    provideOAuthClient(),

    // Restaura la sesión antes del primer render para que authGuard no expulse al usuario.
    provideAppInitializer(() => inject(AuthService).restaurarSesion()),

    // Puerto de preferencias: cambiar el adaptador es cambiar este provide.
    { provide: REPOSITORIO_PREFERENCIAS, useExisting: PreferenciasLocalStorageRepositorio },
    { provide: CATALOGO_ANUNCIOS, useValue: ANUNCIOS_DEL_SISTEMA },

    // Aplica tema antes del primer render (evita parpadeo).
    provideAppInitializer(() => void inject(PreferenciasService)),

    // Registra reportes visitados para los accesos rápidos del Home.
    provideAppInitializer(() => inject(RecientesService).iniciar()),

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
      ripple: false,
    }),
    MessageService,

    // Fuentes del buscador global: agregar un módulo es sumar su FuenteBusqueda aquí.
    { provide: FUENTE_BUSQUEDA, useExisting: FuenteNavegacionService, multi: true },
    { provide: FUENTE_BUSQUEDA, useExisting: FuenteDashboardsService, multi: true },

    // PWA: cachea el app-shell. No cachea datos del backend Ant/Winder (ver ngsw-config.json).
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
