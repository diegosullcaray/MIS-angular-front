import { Routes } from '@angular/router';

/** Rutas de "Actividad Diaria → Portafolio Reasignado". El `path` de cada una es el del legado. */
export const PORTAFOLIO_REASIGNADO_ROUTES: Routes = [
  {
    /** Legado `actividad-diaria/reasignado/reasignado` (`RS_MON_EFECREASIG_03`). */
    path: 'repositorio/actividad-diaria/reasignado/reasignado',
    loadComponent: () =>
      import('./items/efectividad-cartera-reasignada/efectividad-cartera-reasignada.component').then(
        (c) => c.EfectividadCarteraReasignadaComponent,
      ),
  },
  {
    /** Legado `gest_cart_her` (`RS_AGE_COM_CR`, host `cra-v11`). */
    path: 'leg/com/rda/adm/gest_cart_her',
    loadComponent: () =>
      import('./items/gestion-cartera-reasignada/gestion-cartera-reasignada.component').then(
        (c) => c.GestionCarteraReasignadaComponent,
      ),
  },
  {
    /** Legado `mon-efec-reasig` (`RS_MON_EFECREASIG`, host `cra-v12`). */
    path: 'leg/com/rda/adm/mon-efec-reasig',
    loadComponent: () =>
      import('./items/monitor-efectividades-reasignados/monitor-efectividades-reasignados.component').then(
        (c) => c.MonitorEfectividadesReasignadosComponent,
      ),
  },
];
