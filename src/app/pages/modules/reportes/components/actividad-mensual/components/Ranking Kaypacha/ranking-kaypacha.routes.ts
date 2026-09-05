import { Routes } from '@angular/router';

export const RANKING_KAYPACHA_ROUTES: Routes = [
  {
    path: 'leg/com/rma/adm/rank-kay',
    loadComponent: () =>
      import('./items/comercial/comercial.component').then((c) => c.RankingKaypachaComercialComponent),
  },
  {
    path: 'leg/com/rma/adm/rank-kay-ope',
    loadComponent: () =>
      import('./items/operaciones/operaciones.component').then((c) => c.RankingKaypachaOperacionesComponent),
  },
  {
    path: 'leg/com/rma/adm/rank-kay-recu',
    loadComponent: () =>
      import('./items/recuperaciones/recuperaciones.component').then((c) => c.RankingKaypachaRecuperacionesComponent),
  },
];
