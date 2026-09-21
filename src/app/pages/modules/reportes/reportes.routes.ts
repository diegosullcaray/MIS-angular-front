import { Routes } from '@angular/router';
import { ACTIVIDAD_DIARIA_ROUTES } from './components/actividad-diaria/actividad-diaria.routes';
import { ACTIVIDAD_MENSUAL_ROUTES } from './components/actividad-mensual/actividad-mensual.routes';
import { ANALISTA_ROUTES } from './components/analista/analista.routes';
import { AVANCE_COMERCIAL_ROUTES } from './components/avance-comercial/avance-comercial.routes';
import { DESARROLLO_SOSTENIBLE_ROUTES } from './components/desarrollo-sostenible/desarrollo-sostenible.routes';

/** Rutas de "Reportes" (`/app/reportes`, ver `app.routes.ts`) — migración del legado STG (`pages/modules/reportes`, `Rep01Module`) nodo por nodo. */
export const REPORTES_ROUTE: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('../../full-pages/layout/components/explorador-aterrizaje/explorador-aterrizaje.component').then(
        (m) => m.ExploradorAterrizajeComponent
      ),
  },
  ...ACTIVIDAD_DIARIA_ROUTES,
  ...ACTIVIDAD_MENSUAL_ROUTES,
  ...AVANCE_COMERCIAL_ROUTES,
  ...DESARROLLO_SOSTENIBLE_ROUTES,
  {
    path: 'leg/prd',
    loadComponent: () =>
      import('./components/control-cargas/control-cargas.component').then((m) => m.ControlCargasComponent),
  },

  ...ANALISTA_ROUTES,
  {
    path: '**',
    loadComponent: () =>
      import('../../full-pages/layout/components/explorador-aterrizaje/explorador-aterrizaje.component').then(
        (m) => m.ExploradorAterrizajeComponent
      ),
  },
];
