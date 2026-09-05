import { Routes } from '@angular/router';

export const APLICATIVO_MOVIL_ROUTES: Routes = [
  {
    path: 'leg/com/rma/adm/app_uso_m',
    loadComponent: () => import('./items/plan-datos/plan-datos.component').then((c) => c.PlanDatosComponent),
  },
];
