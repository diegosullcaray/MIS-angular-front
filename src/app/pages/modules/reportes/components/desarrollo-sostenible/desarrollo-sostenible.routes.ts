import { Routes } from '@angular/router';

/** Rutas de "Desarrollo Sostenible" — separadas de `reportes.routes.ts` por la misma razón que `analista.routes.ts`. */
export const DESARROLLO_SOSTENIBLE_ROUTES: Routes = [
  {
    path: 'leg/com/rda/adm/mon-desem-misi',
    loadComponent: () =>
      import('./monitor-productos-misionales/monitor-productos-misionales.component').then(
        (m) => m.MonitorProductosMisionalesComponent
      ),
  },
  {
    path: 'leg/com/rda/adm/desemp-social',
    loadComponent: () => import('./desempeno-social/desempeno-social.component').then((m) => m.DesempenoSocialComponent),
  },
  {
    path: 'repositorio/actividad-diaria/prod-misionales/productos-misionales',
    loadComponent: () => import('./productos-misionales/productos-misionales.component').then((m) => m.ProductosMisionalesComponent),
  },
  {
    path: 'repositorio/actividad-diaria/poblacion-misional/poblacion-misional',
    loadComponent: () => import('./poblacion-misional/poblacion-misional.component').then((m) => m.PoblacionMisionalComponent),
  },
];
