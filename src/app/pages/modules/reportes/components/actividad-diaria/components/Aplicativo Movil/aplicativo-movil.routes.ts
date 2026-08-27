import { Routes } from '@angular/router';

/** Rutas de "Actividad Diaria → Aplicativo Móvil". El `path` de cada una es el del legado. */
export const APLICATIVO_MOVIL_ROUTES: Routes = [
  {
    /** Legado `app_uso` (`APP_USO_01`, host `cra-v1p1`, sin `fec`). */
    path: 'leg/com/rda/adm/app_uso',
    loadComponent: () => import('./items/app-uso/app-uso.component').then((c) => c.AppUsoComponent),
  },
];
