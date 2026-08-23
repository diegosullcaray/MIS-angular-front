import { Routes } from '@angular/router';

/** Rutas de "Actividad Diaria" — separadas de `reportes.routes.ts` por la misma razón que `analista.routes.ts`. */
export const CAPTACIONES_ROUTES: Routes = [
  {

    // items 

    /** Legado `cmg-capta01` (`GCMGCAP`). */
    path: 'leg/com/rda/adm/cmg-capta01',
    loadComponent: () =>
      import('./items/cmg-captaciones-agencias/cmg-captaciones-agencias.component')
        .then((c) => c.CmgCaptacionesAgenciasComponent)
  },
  {
    /** Legado `cap-age` (`captacion_canal`). */
    path: 'leg/com/rda/adm/cap-age',
    loadComponent: () =>
      import('./items/captacion-por-canal/captacion-por-canal.component')
        .then((c) => c.CaptacionPorCanalComponent)
  },
  {
    /** Legado `tasa-pas` (`GST_PASIVA`). */
    path: 'leg/com/rda/adm/tasa-pas',
    loadComponent: () =>
      import('./items/gestion-tasas-pasivas/gestion-tasas-pasivas.component')
        .then((c) => c.GestionTasasPasivasComponent)
  },
  {
    /** Legado `panel-operaciones` (`TB_PANEL_OPE`). */
    path: 'leg/com/rda/adm/panel-operaciones',
    loadComponent: () =>
      import('./items/panel-operaciones/panel-operaciones.component')
        .then((c) => c.PanelOperacionesComponent)
  },
  {
    /** Legado `actividad-diaria/carterizacion-com/pasivocom` (`RS_MON_SALCAP_COM_01`). */
    path: 'repositorio/actividad-diaria/carterizacion-com/pasivocom',
    loadComponent: () =>
      import('./items/vinculacion-cartera/vinculacion-cartera.component')
        .then((c) => c.VinculacionCarteraComponent)
  },
  {
    /** Legado `actividad-diaria/carterizacion/pasivo` (`RS_CARTEPAS_01`). */
    path: 'repositorio/actividad-diaria/carterizacion/pasivo',
    loadComponent: () =>
      import('./items/gestion-pasivo-comercial/gestion-pasivo-comercial.component')
        .then((c) => c.GestionPasivoComercialComponent)
  },
  {
    /** recaudo servicos   */
    path: 'leg/com/rda/adm/recaudo-serv-pas',
    loadComponent: () =>
      import('./items/recaudos-servicios/recaudos-servicios.component')
        .then((c) => c.RecaudosServiciosComponent)
  },

  // componentes 
  {
    path: 'leg/com/rda/adm/capta-caract-canal-comercial',
    loadComponent: () =>
      import('./components/captacion-canal-comercial/captacion-canal-comercial.component')

        .then((c) => c.CaptacionCanalComercialComponent)
  },

  {
    path: 'leg/com/rda/adm/capta-caract-canal-operacional',
    loadComponent: () =>
      import('./components/captacion-canal-operaciones/captacion-canal-operaciones.component')

        .then((c) => c.CaptacionCanalOperacionesComponent)
  },
  {
    path: 'leg/com/rda/adm/cmg-cli-pas',
    loadComponent: () =>
      import('./components/CMG Clientes Pasivos/cmg-clientes-flujo/cmg-clientes-flujo.component')

        .then((c) => c.CmgClientesFlujoComponent)
  },
  {
    path: 'leg/com/rda/adm/cmg-cli-pas-stock',
    loadComponent: () =>
      import('./components/CMG Clientes Pasivos/cmg-clientes-stock/cmg-clientes-stock.component')

        .then((c) => c.CmgClientesStockComponent)
  },
  {
    path: 'leg/com/rda/adm/cmg-cli-pas-detalle',
    loadComponent: () =>
      import('./components/CMG Clientes Pasivos/cmg-clientes-flujo-detalle/cmg-clientes-flujo-detalle.component')

        .then((c) => c.CmgClientesFlujoDetalleComponent)
  },

  {
    path: 'leg/com/rda/adm/cap-segui-bp',
    loadComponent: () =>
      import('./components/Seguimiento Banca Preferente/gestion-banca-preferente/gestion-banca-preferente.component')

        .then((c) => c.GestionBancaPreferenteComponent)
  },
    {
    path: 'leg/com/rda/adm/gest-red-ag',
    loadComponent: () =>
      import('./components/Seguimiento Banca Preferente/gestion-red-agencias/gestion-red-agencias.component')

        .then((c) => c.GestionRedAgenciasComponent)
  },



];