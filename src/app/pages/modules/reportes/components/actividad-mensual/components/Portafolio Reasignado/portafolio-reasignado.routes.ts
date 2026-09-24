import { Routes } from '@angular/router';

export const PORTAFOLIO_REASIGNADO_ROUTES: Routes = [
  {
    path: 'leg/com/rma/adm/gest_cart_her-flujo',
    loadComponent: () =>
      import('./items/gestion-cartera-reasignada/gestion-cartera-reasignada.component').then(
        (c) => c.GestionCarteraReasignadaComponent,
      ),
  },
];
