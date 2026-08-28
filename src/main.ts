import { bootstrapApplication } from '@angular/platform-browser';
import { ToastStyle } from 'primeng/toast';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// PrimeNG 21 Toast inlineStyles evalúa `condition && '20px'` produciendo `false` (boolean)
// lo que dispara el warning NG0318 en Angular 22. Normalizamos `false` a `null`.
try {
  const dummy = new ToastStyle() as unknown as { inlineStyles?: { root?: (params: unknown) => Record<string, unknown> } };
  if (dummy.inlineStyles?.root) {
    const originalRoot = dummy.inlineStyles.root;
    dummy.inlineStyles.root = (params: unknown) => {
      const res = originalRoot(params);
      if (res) {
        if (res['bottom'] === false) res['bottom'] = null;
        if (res['right'] === false) res['right'] = null;
        if (res['top'] === false) res['top'] = null;
        if (res['left'] === false) res['left'] = null;
      }
      return res;
    };
  }
} catch {
  // Entornos donde ToastStyle no instancie de forma síncrona
}

bootstrapApplication(App, appConfig).catch((err) => {
  console.error(err);
  document.body.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#5A6A85">No se pudo iniciar la aplicación. Recarga la página o inténtalo más tarde.</div>';
});
