import { Routes } from '@angular/router';

/** Rutas de "Actividad Diaria → Seguros". El `path` de cada una es el del legado. */
export const SEGUROS_ROUTES: Routes = [
  {
    /** Legado `cam-seguros` (`GRSCMIS`, bloques `_01`, `_02`, `_04`, `_05`). */
    path: 'leg/com/rda/adm/cam-seguros',
    loadComponent: () => import('./items/reporte-seguros/reporte-seguros.component').then((c) => c.ReporteSegurosComponent),
  },
  {
    /** Legado `repositorio/seguros-pasivos` (`RS_SEG_PAS_01` a `_04`, motor `table.regular`). */
    path: 'repositorio/actividad-diaria/seguros-pasivos/seguros-pasivos',
    loadComponent: () => import('./items/seguros-pasivos/seguros-pasivos.component').then((c) => c.SegurosPasivosComponent),
  },
  {
    /** Legado `repositorio/seguro-pasivos-graf` (`GRAFSEGPAS_01` y `_02`, bloques de gráfico). */
    path: 'repositorio/actividad-diaria/seg-pasivos-graf/seguro-pasivos-grafico',
    loadComponent: () => import('./items/evolutivo-pasivos/evolutivo-pasivos.component').then((c) => c.EvolutivoPasivosComponent),
  },
  {
    /** Legado `repositorio/seguro-com` (`GRSCMISREP_01`, motor `table.regular`). */
    path: 'repositorio/actividad-diaria/seguro/seguro-com',
    loadComponent: () => import('./items/seguros-optativos/seguros-optativos.component').then((c) => c.SegurosOptativosComponent),
  },
];
