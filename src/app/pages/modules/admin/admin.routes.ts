import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [

  {
    path: 'usuarios',
    loadComponent: () =>
      import('.gestion-usuarios/gestion-usuarios.component').then(
        (m) => m.Ges
      )
  },


];