import { Routes } from '@angular/router';

export const CAPTACIONES_ROUTES: Routes = [
  {
    path: 'leg/com/rma/adm/cmg-capta',
    loadComponent: () =>
      import('./items/cmg-captaciones/cmg-captaciones.component').then((c) => c.CmgCaptacionesComponent),
  },
  {
    path: 'leg/com/rma/adm/seg-bp-men',
    loadComponent: () =>
      import('./items/seguimiento-bp/seguimiento-bp.component').then((c) => c.SeguimientoBpComponent),
  },
  {
    path: 'leg/com/rma/adm/capta-caract-canal-comercial-m',
    loadComponent: () =>
      import('./components/Captacion Comercial/items/captacion-canal/captacion-canal.component').then(
        (c) => c.CaptacionCanalComercialComponent,
      ),
  },
  {
    path: 'leg/com/rma/adm/capta-caract-canal-operacional-m',
    loadComponent: () =>
      import('./components/Captacion Operacional/items/captacion-operacional/captacion-operacional.component').then(
        (c) => c.CaptacionOperacionalComponent,
      ),
  },
];
