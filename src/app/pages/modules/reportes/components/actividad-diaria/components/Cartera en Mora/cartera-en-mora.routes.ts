import { Routes } from '@angular/router';

/** Rutas de "Actividad Diaria → Cartera en Mora". El `path` de cada una es el del legado. */
export const CARTERA_EN_MORA_ROUTES: Routes = [
  // items — reportes del árbol `rda/administracion` (`report-cra-*`)
  {
    /** Legado `cmg-mora` (`cuadro_Variable_Riesgo_01`). */
    path: 'leg/com/rda/adm/cmg-mora',
    loadComponent: () => import('./items/cmg-cartera-mora/cmg-cartera-mora.component').then((c) => c.CmgCarteraMoraComponent),
  },
  {
    /** Legado `cmg-mora-simp` (`cmg_mora_simp_01`). */
    path: 'leg/com/rda/adm/cmg-mora-simp',
    loadComponent: () =>
      import('./items/cmg-cartera-mora-sin-impulso/cmg-cartera-mora-sin-impulso.component').then(
        (c) => c.CmgCarteraMoraSinImpulsoComponent,
      ),
  },
  {
    /** Legado `cal-cart` (`RS_CAL_CAR`, bloques `_01` y `_02`). */
    path: 'leg/com/rda/adm/cal-cart',
    loadComponent: () => import('./items/calidad-cartera/calidad-cartera.component').then((c) => c.CalidadCarteraComponent),
  },
  {
    /** Legado `port-sup` (`PORTSUPE`, bloques `_01` y `_02`). */
    path: 'leg/com/rda/adm/port-sup',
    loadComponent: () =>
      import('./items/portafolios-supervision/portafolios-supervision.component').then((c) => c.PortafoliosSupervisionComponent),
  },
  {
    /** Legado `zu-cuo` (`CEROYCUOTA`, bloques `_01` y `_02`). */
    path: 'leg/com/rda/adm/zu-cuo',
    loadComponent: () => import('./items/cero-una-cuota/cero-una-cuota.component').then((c) => c.CeroUnaCuotaComponent),
  },
  {
    /** Legado `mon-efec` (`RS_MON_EFEC`, host `cra-v4`). */
    path: 'leg/com/rda/adm/mon-efec',
    loadComponent: () =>
      import('./items/monitor-efectividades/monitor-efectividades.component').then((c) => c.MonitorEfectividadesComponent),
  },
  {
    /** Legado `mon-efecrepro` (`RS_MON_EFECREPRO`, host `cra-v7`). */
    path: 'leg/com/rda/adm/mon-efecrepro',
    loadComponent: () =>
      import('./items/seguimiento-reprogramados/seguimiento-reprogramados.component').then(
        (c) => c.SeguimientoReprogramadosComponent,
      ),
  },
  {
    /** Legado `mon-efec-sinasig` (`RMESA_01`, host paginado `cra-V10`). */
    path: 'leg/com/rda/adm/mon-efec-sinasig',
    loadComponent: () =>
      import('./items/efectividades-sin-asignar/efectividades-sin-asignar.component').then(
        (c) => c.EfectividadesSinAsignarComponent,
      ),
  },
  {
    /** Legado `top-efec` (`RSRTOPV01`, el mismo bloque por tres cortes). */
    path: 'leg/com/rda/adm/top-efec',
    loadComponent: () =>
      import('./items/top-variables-riesgo/top-variables-riesgo.component').then((c) => c.TopVariablesRiesgoComponent),
  },
  {
    /** Legado `mon-efectramoscomer` (`RS_MON_EFECTRAMOSC`, host `cra-v7`). */
    path: 'leg/com/rda/adm/mon-efectramoscomer',
    loadComponent: () =>
      import('./items/reporte-pago-puntual/reporte-pago-puntual.component').then((c) => c.ReportePagoPuntualComponent),
  },
  {
    /** Legado `ava-port` (`RS_AVA_POR_01`, el mismo bloque por sus tres `mode`). */
    path: 'leg/com/rda/adm/ava-port',
    loadComponent: () =>
      import('./items/seguimiento-portafolio/seguimiento-portafolio.component').then((c) => c.SeguimientoPortafolioComponent),
  },

  // items — reportes del árbol `repositorio`
  {
    /** Legado `repositorio/mon-imr` (`mon_imr.*` del backend `rep2`). */
    path: 'repositorio/actividad-diaria/cartera/mon-imr',
    loadComponent: () => import('./items/monitor-imr/monitor-imr.component').then((c) => c.MonitorImrComponent),
  },

  // components/Cero Cuotas Nuevas — la familia de reportes de cero cuotas de nuevo ingreso
  {
    /** Legado `graf-dashboard` (`rda/administracion/mora/Dashboard_rda_01`, bloque `graphic`). */
    path: 'leg/com/rda/adm/graf-dashboard',
    loadComponent: () =>
      import('./components/Cero Cuotas Nuevas/items/dashboard/dashboard.component').then((c) => c.CeroCuotasDashboardComponent),
  },
  {
    /** Legado `repositorio/cero-cuotas` (`REP_CERCUOT_01` y `_02`). */
    path: 'repositorio/actividad-diaria/mora/cero-cuotas',
    loadComponent: () =>
      import('./components/Cero Cuotas Nuevas/items/dashboard-revision/dashboard-revision.component').then(
        (c) => c.CeroCuotasDashboardRevisionComponent,
      ),
  },
  {
    /** Legado `cmd-cerocuotanueva` (`CMCUONUEV`, bloques `_01` y `_02`). */
    path: 'leg/com/rda/adm/cmd-cerocuotanueva',
    loadComponent: () =>
      import('./components/Cero Cuotas Nuevas/items/cuadro-mando/cuadro-mando.component').then(
        (c) => c.CeroCuotasCuadroMandoComponent,
      ),
  },
  {
    /** Legado `Top-CeroCuota` (`CEROCUOTA_TOPCNUEVA`, cinco bloques por dos cortes). */
    path: 'leg/com/rda/adm/Top-CeroCuota',
    loadComponent: () =>
      import('./components/Cero Cuotas Nuevas/items/top/top.component').then((c) => c.CeroCuotasTopComponent),
  },
  {
    /** Legado `list-cero-cuotas` (`LCCUOTANUEVA_01`, host paginado `cra-V10`). */
    path: 'leg/com/rda/adm/list-cero-cuotas',
    loadComponent: () =>
      import('./components/Cero Cuotas Nuevas/items/base-gestion/base-gestion.component').then(
        (c) => c.CeroCuotasBaseGestionComponent,
      ),
  },
];
