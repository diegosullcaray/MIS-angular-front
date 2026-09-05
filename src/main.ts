import { bootstrapApplication } from '@angular/platform-browser';
import { BaseComponent } from 'primeng/basecomponent';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// PrimeNG evalúa expresiones del tipo `condition && '20px'` en inlineStyles produciendo `false` (boolean)
// lo que dispara el warning NG0318 en Angular 22. Sanitizamos `false` a `null` de forma global en BaseComponent.
const originalSx = (BaseComponent.prototype as unknown as { sx: (...args: unknown[]) => Record<string, unknown> | undefined }).sx;
if (originalSx) {
  (BaseComponent.prototype as unknown as { sx: (...args: unknown[]) => Record<string, unknown> | undefined }).sx = function (
    this: unknown,
    key = '',
    when = true,
    params = {}
  ) {
    const res = originalSx.call(this, key, when, params);
    if (res && typeof res === 'object') {
      for (const k of Object.keys(res)) {
        if (res[k] === false) {
          res[k] = null;
        }
      }
    }
    return res;
  };
}

bootstrapApplication(App, appConfig).catch((err) => {
  console.error(err);
  document.body.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#5A6A85">No se pudo iniciar la aplicación. Recarga la página o inténtalo más tarde.</div>';
});
