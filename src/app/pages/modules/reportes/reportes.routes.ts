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
      import('./components/avance-comercial/monitor-metas-desembolso/monitor-metas-desembolso.component').then(
        (m) => m.MonitorMetasDesembolsoComponent
      ),
  },
  {
    path: 'leg/com/rda/adm/mon-rep',
    loadComponent: () =>
      import('./components/avance-comercial/monitor-reprogramados/monitor-reprogramados.component').then(
        (m) => m.MonitorReprogramadosComponent
      ),
  },
  {
    path: 'leg/com/rda/adm/mon-desem-misi',
    loadComponent: () =>
      import('./components/desarrollo-sostenible/monitor-productos-misionales/monitor-productos-misionales.component').then(
        (m) => m.MonitorProductosMisionalesComponent
      ),
  },
  {
    path: 'leg/com/rda/adm/desemp-social',
    loadComponent: () =>
      import('./components/desarrollo-sostenible/desempeno-social/desempeno-social.component').then(
        (m) => m.DesempenoSocialComponent
      ),
  },
  {
    path: 'repositorio/actividad-diaria/prod-misionales/productos-misionales',
    loadComponent: () =>
      import('./components/desarrollo-sostenible/productos-misionales/productos-misionales.component').then(
        (m) => m.ProductosMisionalesComponent
      ),
  },
  {
    path: 'repositorio/actividad-diaria/poblacion-misional/poblacion-misional',
    loadComponent: () =>
      import('./components/desarrollo-sostenible/poblacion-misional/poblacion-misional.component').then(
        (m) => m.PoblacionMisionalComponent
      ),
  },
  {
    path: 'leg/prd',
    loadComponent: () =>
      import('./components/control-cargas/control-cargas.component').then((m) => m.ControlCargasComponent),
  },
  {
    path: 'leg/sis',
    loadComponent: () =>
      import('./components/sistema/usabilidad/usabilidad.component').then((m) => m.UsabilidadComponent),
  },
  {
    path: '**',
    redirectTo: 'leg/com/rda/adm/mon-desem',
  },
];
