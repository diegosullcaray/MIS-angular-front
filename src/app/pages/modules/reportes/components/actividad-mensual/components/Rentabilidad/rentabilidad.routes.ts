import { Routes } from '@angular/router';

export const RENTABILIDAD_ROUTES: Routes = [
  {
    path: 'leg/com/rma/adm/res-un',
    loadComponent: () =>
      import('./items/resultados-unidad-negocio/resultados-unidad-negocio.component').then(
        (c) => c.ResultadosUnidadNegocioComponent,
      ),
  },
  {
    path: 'repositorio/actividad-mensual/rentabilidad/cuenta-resultados',
    loadComponent: () =>
      import('./items/cuenta-resultados/cuenta-resultados.component').then((c) => c.CuentaResultadosComponent),
  },
];
