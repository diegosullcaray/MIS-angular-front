import { Routes } from '@angular/router';

export const PORTAFOLIO_REASIGNADO_ROUTES: Routes = [
  {
    path: 'leg/com/rma/adm/gest_cart_her-flujo',
    loadComponent: () =>
      import('./items/gestion-cartera-reasignada/gestion-cartera-reasignada.component').then(
        (c) => c.GestionCarteraReasignadaComponent,
      ),
  },
  {
    path: 'leg/com/rma/adm/gest_cart_stock',
    loadComponent: () =>
      import('./items/gestion-cartera-stock/gestion-cartera-stock.component').then(
        (c) => c.GestionCarteraStockComponent,
      ),
  },
];
