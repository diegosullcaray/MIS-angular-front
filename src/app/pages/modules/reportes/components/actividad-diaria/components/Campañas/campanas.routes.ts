import { Routes } from '@angular/router';

/** Rutas de "Actividad Diaria → Campañas". El `path` de cada una es el del legado. */
export const CAMPANAS_ROUTES: Routes = [
  {
    /** Legado `cam-apa` (`R_APADRINA_01`, pide el corte como `fecha`). */
    path: 'leg/com/rda/adm/cam-apa',
    loadComponent: () => import('./items/apadrinamiento/apadrinamiento.component').then((c) => c.ApadrinamientoComponent),
  },
  {
    /** Legado `RMentoring` (`RMENTORIN_01`, host `cra-v1p7`). */
    path: 'leg/com/rda/adm/RMentoring',
    loadComponent: () => import('./items/mentoring/mentoring.component').then((c) => c.MentoringComponent),
  },
  {
    /** Legado `repositorio/agenda-comercial` (`RS_AGE_COM_01` a `_03`, motor `table.regular`). */
    path: 'repositorio/actividad-diaria/campanias/agendamiento',
    loadComponent: () => import('./items/agendamiento/agendamiento.component').then((c) => c.AgendamientoComponent),
  },
];
