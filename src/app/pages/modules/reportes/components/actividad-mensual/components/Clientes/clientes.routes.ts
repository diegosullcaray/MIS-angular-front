import { Routes } from '@angular/router';

export const CLIENTES_ROUTES: Routes = [
  {
    path: 'leg/com/rma/adm/cmg-cli',
    loadComponent: () =>
      import('./items/cmg-clientes-activo/cmg-clientes-activo.component').then((c) => c.CmgClientesActivoComponent),
  },
  {
    path: 'leg/com/rma/adm/desemp-social',
    loadComponent: () =>
      import('./items/desempeno-social/desempeno-social.component').then((c) => c.DesempenoSocialComponent),
  },
  {
    path: 'leg/com/rma/adm/cmg_cliente_flujo',
    loadComponent: () =>
      import('./items/cmg-clientes-flujo/cmg-clientes-flujo.component').then((c) => c.CmgClientesFlujoComponent),
  },
];
