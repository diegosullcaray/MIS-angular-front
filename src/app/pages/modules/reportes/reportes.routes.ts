import { Routes } from '@angular/router';

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
  {
    path: 'avance-comercial',
    redirectTo: 'leg/com/rda/adm/mon-desem',
    pathMatch: 'full',
  },
  {
    path: 'leg/com/rda/adm/mon-desem',
    loadComponent: () =>
      import('./components/avance_comercial/monitor-metas-desembolso/monitor-metas-desembolso.component').then(
        (m) => m.MonitorMetasDesembolsoComponent
      ),
  },
  {
    path: 'leg/com/rda/adm/mon-rep',
    loadComponent: () =>
      import('./components/avance_comercial/monitor-reprogramados/monitor-reprogramados.component').then(
        (m) => m.MonitorReprogramadosComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'leg/com/rda/adm/mon-desem',
  },
];
