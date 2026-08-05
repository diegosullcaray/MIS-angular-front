import { Routes } from '@angular/router';

export const ACTIVIDADES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/actividades-home/actividades-home.component').then(
        (m) => m.ActividadesHomeComponent
      ),
  },
  {
    // Destino de Crédito (ruta legado: dest-credito)
    path: 'dest-credito',
    loadComponent: () =>
      import('./components/destino-credito/destino-credito.component').then(
        (m) => m.DestinoCreditoComponent
      ),
  },
  {
    // Registro de Prospectos Corresponsal (ruta legado: reg-prosp-corr)
    path: 'reg-prosp-corr',
    loadComponent: () =>
      import('./components/prospectos-corresponsal/prospectos-corresponsal.component').then(
        (m) => m.ProspectosCorresponsalComponent
      ),
  },
  {
    // Transacciones Corresponsal (ruta legado: regprosp-corr)
    path: 'regprosp-corr',
    loadComponent: () =>
      import('./components/transacciones-corresponsal/transacciones-corresponsal.component').then(
        (m) => m.TransaccionesCorresponsalComponent
      ),
  },
];
