import { Routes } from '@angular/router';

/** Rutas de "Presupuesto" — mismos segmentos que usaba el módulo legado STG (`docs/07-modulos/presupuesto`), montado bajo `/app/presupuesto` (ver `app.routes.ts`). */
export const PRESUPUESTO_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'lineas/activos/car-cre',
  },
  {
    path: 'lineas/activos/car-cre',
    loadComponent: () =>
      import('./components/lineas/cartera-creditos/cartera-creditos.component').then(
        (m) => m.CarteraCreditosComponent
      ),
  },
  {
    path: 'lineas/pasivos-patrimonio/car-dep-bp',
    loadComponent: () =>
      import('./components/lineas/deposito-bp/deposito-bp.component').then((m) => m.DepositoBpComponent),
  },
  {
    path: 'lineas/pasivos-patrimonio/car-dep-red',
    loadComponent: () =>
      import('./components/lineas/deposito-red/deposito-red.component').then((m) => m.DepositoRedComponent),
  },
  {
    path: 'lineas/pasivos-patrimonio/seg-com',
    loadComponent: () =>
      import('./components/lineas/seguros-comercial/seguros-comercial.component').then(
        (m) => m.SegurosComercialComponent
      ),
  },
  {
    path: 'lineas/pasivos-patrimonio/seg-ope',
    loadComponent: () =>
      import('./components/lineas/seguros-operaciones/seguros-operaciones.component').then(
        (m) => m.SegurosOperacionesComponent
      ),
  },
  {
    path: 'gestion/sistema/resp',
    loadComponent: () =>
      import('./components/gestion/responsables/responsables.component').then((m) => m.ResponsablesComponent),
  },
  {
    path: 'gestion/seguimiento/tbl-ver',
    loadComponent: () =>
      import('./components/gestion/tablero-verificacion/tablero-verificacion.component').then(
        (m) => m.TableroVerificacionComponent
      ),
  },
];
