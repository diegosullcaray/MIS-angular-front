import { Routes } from '@angular/router';

export const KAYPACHA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/kaypacha-home/kaypacha-home.component').then(
        (m) => m.KaypachaHomeComponent
      )
  },
  {
    path: 'categoria/:id',
    loadComponent: () =>
      import('./components/categoria-detalle/categoria-detalle.component').then(
        (m) => m.CategoriaDetalleComponent
      )
  }
];
