import { Routes } from '@angular/router';

/**
 * Rutas de los reportes de "Analista" (legado STG `rda/sectorista` +
 * `rda/administracion`) — separadas de `reportes.routes.ts` para que ese
 * archivo no se sature a medida que se migran los ~25 reportes de esta
 * categoría uno por uno. Se agregan acá, no en el módulo `analista/`
 * (dashboard/listas) que ya existía: son reportes del motor "mixto", mismo
 * patrón que el resto de `reportes`.
 */
export const ANALISTA_ROUTES: Routes = [
  {
    path: 'leg/com/rda/sec/cap-ret',
    loadComponent: () => import('./encuesta-clientes/encuesta-clientes.component').then((m) => m.EncuestaClientesComponent),
  },
  {
    path: 'leg/com/rda/sec/repro',
    loadComponent: () =>
      import('./clientes-reprogramados/clientes-reprogramados.component').then((m) => m.ClientesReprogramadosComponent),
  },
  {
    path: 'leg/com/rda/sec/cli-act',
    loadComponent: () => import('./datos-clientes/datos-clientes.component').then((m) => m.DatosClientesComponent),
  },
  {
    path: 'leg/com/rda/sec/cartera',
    loadComponent: () => import('./cartera/cartera.component').then((m) => m.CarteraComponent),
  },
  {
    path: 'leg/com/rda/sec/cli-prod',
    loadComponent: () => import('./clientes-producto/clientes-producto.component').then((m) => m.ClientesProductoComponent),
  },
  {
    path: 'leg/com/rda/sec/cli-nue-rec',
    loadComponent: () =>
      import('./clientes-nuevos-recurrentes/clientes-nuevos-recurrentes.component').then(
        (m) => m.ClientesNuevosRecurrentesComponent,
      ),
  },
  {
    path: 'leg/com/rda/sec/capta',
    loadComponent: () => import('./captaciones/captaciones.component').then((m) => m.CaptacionesComponent),
  },
];
