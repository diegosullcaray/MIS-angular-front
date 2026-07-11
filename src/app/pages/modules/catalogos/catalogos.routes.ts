import { Routes } from '@angular/router';

export const CATALOGOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/catalogos-shell/catalogos-shell.component').then(
        (m) => m.CatalogosShellComponent
      )
  },
  {
    path: ':tipo',
    loadComponent: () =>
      import('./components/catalogo-detalle/catalogo-detalle.component').then(
        (m) => m.CatalogoDetalleComponent
      )
  }
];
