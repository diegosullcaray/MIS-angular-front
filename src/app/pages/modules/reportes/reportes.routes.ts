import { Routes } from '@angular/router';
import { ACTIVIDAD_DIARIA_ROUTES } from './components/actividad-diaria/actividad-diaria.routes';
import { ANALISTA_ROUTES } from './components/analista/analista.routes';
import { AVANCE_COMERCIAL_ROUTES } from './components/avance-comercial/avance-comercial.routes';
import { DESARROLLO_SOSTENIBLE_ROUTES } from './components/desarrollo-sostenible/desarrollo-sostenible.routes';

/**
 * Rutas de "Reportes" (`/app/reportes`, ver `app.routes.ts`) — migración del
 * legado STG (`pages/modules/reportes`, `Rep01Module`) nodo por nodo.
 * Cada reporte ("Monitor Metas Desembolso" y "Monitor Reprogramados") vive en
 * su propio panel e interfaz independiente bajo su propia ruta legado STG.
 */
export const REPORTES_ROUTE: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'leg/com/rda/adm/mon-desem',
  },
  ...ACTIVIDAD_DIARIA_ROUTES,
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
    redirectTo: 'leg/com/rda/adm/mon-desem',
  },
];
