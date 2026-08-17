import { Routes } from '@angular/router';

/**
 * Rutas de "Actividad Diaria" — separadas de `reportes.routes.ts` por la misma
 * razón que `analista.routes.ts`. Los segmentos replican los del legado STG
 * (`rda-administracion-routing.module.ts`), que es lo que manda el menú.
 */
export const ACTIVIDAD_DIARIA_ROUTES: Routes = [
  {
    /** "CMG Captaciones - Agencias" (legado `cmg-capta01`, `report: GCMGCAP`). */
    path: 'leg/com/rda/adm/cmg-capta01',
    loadComponent: () =>
      import('./components/Captaciones/cmg-captaciones/cmg-captaciones.component').then((m) => m.CmgCaptacionesComponent),
  },
];
