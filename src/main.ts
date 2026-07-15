(globalThis as any).ngDevMode = (globalThis as any).ngDevMode || false;

import { initFederation } from '@angular-architects/native-federation';

// Un Remote NO tiene federation.manifest.json (eso es del Host):
// initFederation() sin argumentos prepara los metadatos propios y arranca.
initFederation()
  .catch((err) => console.error(err))
  .then((_) => import('./bootstrap'))
  .catch((err) => console.error(err));
