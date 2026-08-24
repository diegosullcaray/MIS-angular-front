import { Routes } from '@angular/router';

/** Rutas de "Actividad Diaria → Cartera". El `path` de cada una es el del legado. */
export const CARTERA_ROUTES: Routes = [
  // items — reportes del árbol `rda/administracion` (`report-cra-*`)
  {
    /** Legado `saldo` (`RS_SAL_CAR`, bloques `_04` y `_05`). */
    path: 'leg/com/rda/adm/saldo',
    loadComponent: () => import('./items/saldo-cartera/saldo-cartera.component').then((c) => c.SaldoCarteraComponent),
  },
  {
    /** Legado `dat-prod` (`RS_DAT_PRO`, bloques `_01` a `_03`). */
    path: 'leg/com/rda/adm/dat-prod',
    loadComponent: () => import('./items/datos-producto/datos-producto.component').then((c) => c.DatosProductoComponent),
  },
  {
    /** Legado `port-agro` (`PortafolioAgro`). */
    path: 'leg/com/rda/adm/port-agro',
    loadComponent: () => import('./items/portafolio-agro/portafolio-agro.component').then((c) => c.PortafolioAgroComponent),
  },
  {
    /** Legado `desem-dia` (`DesemDiario`, bloques `_01` a `_03`). */
    path: 'leg/com/rda/adm/desem-dia',
    loadComponent: () =>
      import('./items/desembolsos-diarios/desembolsos-diarios.component').then((c) => c.DesembolsosDiariosComponent),
  },
  {
    /** Legado `aut-tasa` (`GST_ACTIVAS`). */
    path: 'leg/com/rda/adm/aut-tasa',
    loadComponent: () => import('./items/autonomia-tasas/autonomia-tasas.component').then((c) => c.AutonomiaTasasComponent),
  },
  {
    /** Legado `ranking-diar` (`reporte_autonomia_newdiaria`). */
    path: 'leg/com/rda/adm/ranking-diar',
    loadComponent: () =>
      import('./items/ranking-autonomias/ranking-autonomias.component').then((c) => c.RankingAutonomiasComponent),
  },
  {
    /** Legado `des-cred` (`DESCRED`). */
    path: 'leg/com/rda/adm/des-cred',
    loadComponent: () => import('./items/destino-credito/destino-credito.component').then((c) => c.DestinoCreditoComponent),
  },
  {
    /** Legado `com-dia` (`GCOMCRE`, bloque `_02`). */
    path: 'leg/com/rda/adm/com-dia',
    loadComponent: () =>
      import('./items/comite-creditos-diario/comite-creditos-diario.component').then((c) => c.ComiteCreditosDiarioComponent),
  },

  // items — reportes del árbol `repositorio`
  {
    /** Legado `actividad-diaria/cartera/cmg-cartera` (`CMG_CARTERA_01`/`_02`). */
    path: 'repositorio/actividad-diaria/cartera/cmg-cartera',
    loadComponent: () => import('./items/cmg-cartera/cmg-cartera.component').then((c) => c.CmgCarteraComponent),
  },
  {
    /** Legado `actividad-diaria/cartera/estructura-desembolsos` (`RS_DESEMB_01`). */
    path: 'repositorio/actividad-diaria/cartera/estructura-desembolsos',
    loadComponent: () =>
      import('./items/estructura-desembolsos/estructura-desembolsos.component').then((c) => c.EstructuraDesembolsosComponent),
  },
  {
    /** Legado `actividad-diaria/cartera/rank-comercial` (`RS_RANK_COM_01`). */
    path: 'repositorio/actividad-diaria/cartera/rank-comercial',
    loadComponent: () => import('./items/ranking-comercial/ranking-comercial.component').then((c) => c.RankingComercialComponent),
  },
  {
    /** Legado `actividad-diaria/cartera/agro-mix` (`RS_AGROMIX_01` a `_05`). */
    path: 'repositorio/actividad-diaria/cartera/agro-mix',
    loadComponent: () =>
      import('./items/cartera-agricola-cultivos/cartera-agricola-cultivos.component').then(
        (c) => c.CarteraAgricolaCultivosComponent,
      ),
  },
  {
    /** Legado `actividad-diaria/cartera/gest-comercial` (`RS_GEST_COM_*`). */
    path: 'repositorio/actividad-diaria/cartera/gest-comercial',
    loadComponent: () => import('./items/gestion-comercial/gestion-comercial.component').then((c) => c.GestionComercialComponent),
  },
  {
    /** Legado `actividad-diaria/cartera/mon-retenciones` (`repositorio/mon-salidas`). */
    path: 'repositorio/actividad-diaria/cartera/mon-retenciones',
    loadComponent: () =>
      import('./items/monitor-salidas-retenciones/monitor-salidas-retenciones.component').then(
        (c) => c.MonitorSalidasRetencionesComponent,
      ),
  },
  {
    /** Legado `actividad-diaria/mon-comercial/Monincome` (`RS_MON_INT_COM_01`). */
    path: 'repositorio/actividad-diaria/mon-comercial/Monincome',
    loadComponent: () =>
      import('./items/monitor-inteligencia-comercial/monitor-inteligencia-comercial.component').then(
        (c) => c.MonitorInteligenciaComercialComponent,
      ),
  },

  // components/PDM — la familia de reportes de Plan de Desarrollo Municipal
  {
    /** Legado `act-pdm` (`RACTGP`). */
    path: 'leg/com/rda/adm/act-pdm',
    loadComponent: () => import('./components/PDM/activas-pdm/activas-pdm.component').then((c) => c.ActivasPdmComponent),
  },
  {
    /** Legado `mora-pdm` (`RESMORAGP`). */
    path: 'leg/com/rda/adm/mora-pdm',
    loadComponent: () => import('./components/PDM/mora-pdm/mora-pdm.component').then((c) => c.MoraPdmComponent),
  },
  {
    /** Legado `res-inc_pdm` (`RESINCGRUP`). */
    path: 'leg/com/rda/adm/res-inc_pdm',
    loadComponent: () =>
      import('./components/PDM/detalle-incentivos-pdm/detalle-incentivos-pdm.component').then(
        (c) => c.DetalleIncentivosPdmComponent,
      ),
  },
  {
    /** Legado `det-ince-pdm` (`DET_INCEN_PDM`). */
    path: 'leg/com/rda/adm/det-ince-pdm',
    loadComponent: () => import('./components/PDM/desembolsos-pdm/desembolsos-pdm.component').then((c) => c.DesembolsosPdmComponent),
  },
];
