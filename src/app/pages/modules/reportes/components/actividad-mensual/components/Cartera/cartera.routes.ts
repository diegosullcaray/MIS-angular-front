import { Routes } from '@angular/router';

export const CARTERA_ROUTES: Routes = [
  {
    path: 'leg/com/rma/adm/cart-prod',
    loadComponent: () =>
      import('./items/cartera-producto/cartera-producto.component').then((c) => c.CarteraProductoComponent),
  },
  {
    path: 'repositorio/actividad-mensual/cartera/cmg-cartera-m',
    loadComponent: () => import('./items/cmg-cartera/cmg-cartera.component').then((c) => c.CmgCarteraComponent),
  },
  {
    // Alias para tolerancia de ruta
    path: 'repositorio/actividad-mensual/cartera/cmg-cartera',
    redirectTo: 'repositorio/actividad-mensual/cartera/cmg-cartera-m',
  },
  {
    path: 'leg/com/rma/adm/pro-gob-m',
    loadComponent: () =>
      import('./items/programas-gobierno/programas-gobierno.component').then((c) => c.ProgramasGobiernoComponent),
  },
  {
    path: 'leg/com/rma/adm/cont-elect-m',
    loadComponent: () =>
      import('./items/contratacion-electronica/contratacion-electronica.component').then(
        (c) => c.ContratacionElectronicaComponent,
      ),
  },
  {
    path: 'leg/com/rma/adm/rep-aut-tas',
    loadComponent: () =>
      import('./items/ranking-autonomias-tasas/ranking-autonomias-tasas.component').then(
        (c) => c.RankingAutonomiasTasasComponent,
      ),
  },
  {
    path: 'repositorio/actividad-mensual/cartera/estructura-desembolsos',
    loadComponent: () =>
      import('./items/estructura-desembolsos/estructura-desembolsos.component').then(
        (c) => c.EstructuraDesembolsosComponent,
      ),
  },
  {
    path: 'leg/com/rma/adm/tp-mes',
    loadComponent: () =>
      import('./items/tasas-mes-producto/tasas-mes-producto.component').then((c) => c.TasasMesProductoComponent),
  },
  {
    path: 'leg/com/rma/adm/seg_comite',
    loadComponent: () =>
      import('./items/comite-creditos/comite-creditos.component').then((c) => c.ComiteCreditosComponent),
  },
  {
    path: 'leg/com/rma/adm/dat-prod-men',
    loadComponent: () =>
      import('./items/datos-producto/datos-producto.component').then((c) => c.DatosProductoComponent),
  },
  {
    path: 'repositorio/actividad-mensual/cartera/agro-mix-m',
    loadComponent: () =>
      import('./items/cartera-agricola-cultivos/cartera-agricola-cultivos.component').then(
        (c) => c.CarteraAgricolaCultivosComponent,
      ),
  },
  {
    // Alias para tolerancia de ruta
    path: 'repositorio/actividad-mensual/cartera/agro-mix',
    redirectTo: 'repositorio/actividad-mensual/cartera/agro-mix-m',
  },
];
