import { Routes } from '@angular/router';

/**
 * Rutas de "Reportes" (`/app/reportes`, ver `app.routes.ts`) — migración del
 * legado STG (`pages/modules/reportes`, `Rep01Module`) nodo por nodo. Primer
 * nodo migrado: "Avance Comercial" (`avance-comercial`, ver
 * `components/avance_comercial`) — el resto del árbol del legado
 * (actividad diaria, control de cargas, desarrollo sostenible, etc.) queda
 * fuera de este primer recorte.
 */
export const REPORTES_ROUTE: Routes = [
  {
    path: 'avance-comercial',
    loadComponent: () =>
      import('./components/avance_comercial/avance-comercial.component').then((m) => m.AvanceComercialComponent),
  },
];
