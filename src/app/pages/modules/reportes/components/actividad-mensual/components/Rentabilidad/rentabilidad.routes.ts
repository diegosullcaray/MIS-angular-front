import { Routes } from '@angular/router';

export const RENTABILIDAD_ROUTES: Routes = [
  {
    path: 'leg/com/rma/adm/res-un',
    loadComponent: () =>
      import('./items/resultados-unidad-negocio/resultados-unidad-negocio.component').then(
        (c) => c.ResultadosUnidadNegocioComponent,
      ),
  },
];
