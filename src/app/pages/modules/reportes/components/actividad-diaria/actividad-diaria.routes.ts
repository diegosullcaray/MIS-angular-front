import { Routes } from '@angular/router';

/** Rutas de "Actividad Diaria" — separadas de `reportes.routes.ts` por la misma razón que `analista.routes.ts`. */
export const ACTIVIDAD_DIARIA_ROUTES: Routes = [
  {
    /** Legado `cmg-capta01` (`GCMGCAP`). */
    path: 'leg/com/rda/adm/cmg-capta01',
    loadComponent: () =>
      import('./components/captaciones/cmg-captaciones-agencias/cmg-captaciones-agencias.component').then(
        (m) => m.CmgCaptacionesAgenciasComponent,
      ),
  },
  {
    /** Legado `cap-age` (`captacion_canal`). */
    path: 'leg/com/rda/adm/cap-age',
    loadComponent: () =>
      import('./components/captaciones/captacion-por-canal/captacion-por-canal.component').then(
        (m) => m.CaptacionPorCanalComponent,
      ),
  },
  {
    /** Legado `tasa-pas` (`GST_PASIVA`). */
    path: 'leg/com/rda/adm/tasa-pas',
    loadComponent: () =>
      import('./components/captaciones/gestion-tasas-pasivas/gestion-tasas-pasivas.component').then(
        (m) => m.GestionTasasPasivasComponent,
      ),
  },
  {
    /** Legado `panel-operaciones` (`TB_PANEL_OPE`). */
    path: 'leg/com/rda/adm/panel-operaciones',
    loadComponent: () =>
      import('./components/captaciones/panel-operaciones/panel-operaciones.component').then(
        (m) => m.PanelOperacionesComponent,
      ),
  },
  {
    /** Legado `capta-caract-canal-comercial` (`CARACT_CARTERA`). */
    path: 'repositorio/actividad-diaria/caracterizacion/pasivocpm',
    loadComponent: () =>
      import('./components/captaciones/vinculacion-cartera/vinculacion-cartera.component').then(
        (m) => m.VinculacionCarteraComponent,
      ),
  },
  {
    /** Legado `capta-caract-canal-operacional` (`CARACT_pas`). */
    path: 'repositorio/actividad-diaria/caracterizacion/pasivo',
    loadComponent: () =>
      import('./components/captaciones/gestion-pasivo-comercial/gestion-pasivo-comercial.component').then(
        (m) => m.GestionPasivoComercialComponent,
      ),
  },
];
