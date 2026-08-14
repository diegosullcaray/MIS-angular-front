import { Routes } from '@angular/router';

/** Rutas de "Avance Comercial" — separadas de `reportes.routes.ts` por la misma razón que `analista.routes.ts`. */
export const AVANCE_COMERCIAL_ROUTES: Routes = [
  {
    path: 'avance-comercial',
    redirectTo: 'leg/com/rda/adm/mon-desem',
    pathMatch: 'full',
  },
  {
    path: 'leg/com/rda/adm/mon-desem',
    loadComponent: () =>
      import('./monitor-metas-desembolso/monitor-metas-desembolso.component').then((m) => m.MonitorMetasDesembolsoComponent),
  },
  {
    path: 'leg/com/rda/adm/mon-rep',
    loadComponent: () => import('./monitor-reprogramados/monitor-reprogramados.component').then((m) => m.MonitorReprogramadosComponent),
  },
];
