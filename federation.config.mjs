import { withNativeFederation, shareAll } from '@angular-architects/native-federation/config';

/**
 * Configuración de Native Federation del SISTEMA HIJO (Remote).
 *
 * ★ `name` — es el SLUG del subsistema: debe ser idéntico al registrado en el
 *   `federation.manifest.json` del Host y en Gestión de Sistemas (/admin/sistemas).
 *   Formato obligatorio: `subsistema-<dominio>` en kebab-case.
 *   AL CLONAR LA PLANTILLA: reemplazar `subsistema-plantilla` por el slug asignado.
 *
 * ★ `exposes './Component'` — contrato con el RemoteWrapperComponent del Host.
 *   No renombrar la clave ni quitar el export default del componente raíz.
 *
 * ⚠️ `singleton + strictVersion` exige que las versiones de `@angular/*`,
 *   `primeng` y `rxjs` COINCIDAN con las del Host (RN-05). No actualizar
 *   frameworks sin coordinar con el equipo del Host.
 */
export default withNativeFederation({
  name: 'subsistema-plantilla',

  exposes: {
    './Component': './src/app/remote-root.component.ts',
  },

  shared: {
    ...shareAll(
      { singleton: true, strictVersion: true, requiredVersion: 'auto', build: 'package' },
      {
        overrides: {
          // includeSecondaries is an opt-out of ignoreUnusedDeps, so all of
          // @angular/core is shared to prevent mismatches.
          '@angular/core': {
            singleton: true,
            strictVersion: true,
            requiredVersion: 'auto',
            build: 'package',
            includeSecondaries: { keepAll: true },
          },
          // El bootstrap standalone (app.config) usa animations/async, pero el
          // análisis de dependencias del remote solo mira el módulo expuesto:
          // sin esto, el secondary se poda y el arranque aislado falla.
          '@angular/platform-browser': {
            singleton: true,
            strictVersion: true,
            requiredVersion: 'auto',
            build: 'package',
            includeSecondaries: { keepAll: true },
          },
        },
      },
    ),
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    '@primeuix/themes',
    '@primeng/themes',
    // Add further packages you don't need at runtime
  ],

  features: {
    denseChunking: true,
  },
});
