import { Routes } from '@angular/router';

export const HELP_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'faq'
  },
  {
    path: 'faq',
    loadComponent: () =>
      import('./components/faq/faq.component').then(
        (m) => m.FaqComponent
      )
  },
  {
    path: 'guias',
    loadComponent: () =>
      import('./components/guias/guias.component').then(
        (m) => m.GuiasComponent
      )
  },
  {
    path: 'contacto',
    loadComponent: () =>
      import('./components/contacto/contacto.component').then(
        (m) => m.ContactoComponent
      )
  },
];
