// Predefine antes de que Angular core (cargado como bundle externo de Native
// Federation) lo lea, para evitar un ReferenceError por orden de carga de módulos.
// En `true`: Angular queda en modo desarrollo (necesario para Angular DevTools);
// en un build de producción, el optimizador reemplaza `ngDevMode` en compilación,
// así que este valor de runtime no afecta al bundle final.
(globalThis as any).ngDevMode = (globalThis as any).ngDevMode ?? true;

import { initFederation } from '@angular-architects/native-federation';

initFederation('federation.manifest.json')
  .catch((err) => console.error(err))
  .then((_) => import('./bootstrap'))
  .catch((err) => console.error(err));

