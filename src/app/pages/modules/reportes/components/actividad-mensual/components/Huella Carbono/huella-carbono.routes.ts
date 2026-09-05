import { Routes } from '@angular/router';

export const HUELLA_CARBONO_ROUTES: Routes = [
  {
    path: 'leg/com/rma/adm/huella-carbono-m',
    loadComponent: () => import('./items/huella-carbono/huella-carbono.component').then((c) => c.HuellaCarbonoComponent),
  },
];
