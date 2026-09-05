import { Routes } from '@angular/router';

export const CARTERA_EN_MORA_ROUTES: Routes = [
  {
    path: 'leg/com/rma/adm/cmg-mora',
    loadComponent: () =>
      import('./items/cmg-cartera-mora/cmg-cartera-mora.component').then((c) => c.CmgCarteraMoraComponent),
  },
  {
    path: 'leg/com/rma/adm/graf-cosechas',
    loadComponent: () =>
      import('./items/evolutivo-cosechas/evolutivo-cosechas.component').then((c) => c.EvolutivoCosechasComponent),
  },
  {
    path: 'leg/com/rma/adm/mon-efec',
    loadComponent: () =>
      import('./items/monitor-efectividades/monitor-efectividades.component').then(
        (c) => c.MonitorEfectividadesComponent,
      ),
  },
  {
    path: 'leg/com/rma/adm/mor-efe',
    loadComponent: () =>
      import('./items/mora-efectividad-tramos/mora-efectividad-tramos.component').then(
        (c) => c.MoraEfectividadTramosComponent,
      ),
  },
  {
    path: 'leg/com/rma/adm/mon-efec-reasig',
    loadComponent: () =>
      import('./items/monitor-efectividades-reasignados/monitor-efectividades-reasignados.component').then(
        (c) => c.MonitorEfectividadesReasignadosComponent,
      ),
  },
  {
    path: 'leg/com/rma/adm/graf-dashboard-CN',
    loadComponent: () =>
      import('./items/dashboard-cero-cuota-nueva/dashboard-cero-cuota-nueva.component').then(
        (c) => c.DashboardCeroCuotaNuevaComponent,
      ),
  },
  {
    path: 'leg/com/rma/adm/gest_cart_her',
    loadComponent: () =>
      import('./items/gestion-cartera-reasignada-mes/gestion-cartera-reasignada-mes.component').then(
        (c) => c.GestionCarteraReasignadaMesComponent,
      ),
  },
  {
    path: 'leg/com/rma/adm/cmg-mora-simp-m',
    loadComponent: () =>
      import('./items/cmg-cartera-mora-sin-impulsa/cmg-cartera-mora-sin-impulsa.component').then(
        (c) => c.CmgCarteraMoraSinImpulsaComponent,
      ),
  },
  {
    path: 'leg/com/rma/adm/sema-cosechas',
    loadComponent: () =>
      import('./items/semaforo-cosechas/semaforo-cosechas.component').then((c) => c.SemaforoCosechasComponent),
  },
];
