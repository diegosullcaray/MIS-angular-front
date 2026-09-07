# Configuracion de ejecucion

## Entornos

`Environment` exige `production`, secreto global Winder, secretos por `appId`, URL Ant, OAuth, enlaces externos y usuario de desarrollo opcional. `angular.json` reemplaza `environment.ts` por `environment.prod.ts` en el build de produccion.

## Providers raiz

`app.config.ts` registra:

- deteccion zoneless;
- router con `withComponentInputBinding()`;
- `HttpClient` con Fetch y tres interceptores;
- OAuth;
- restauracion de sesion;
- preferencias y catalogo de anuncios;
- reportes recientes;
- PrimeNG y `MessageService`;
- service worker en produccion.

## PWA

`ngsw-config.json` precarga app shell y carga assets de forma lazy. No existe una regla de cache de API: las respuestas financieras no deben entrar en cache. `registerWhenStable:30000` retrasa el registro hasta estabilidad o 30 segundos.

## Build

- Builder: `@angular/build:application`.
- Build por defecto: produccion.
- Presupuesto inicial: warning 1.5 MB, error 2 MB.
- Presupuesto por estilo: warning 6 KB, error 8 KB.
- `powerbi-client` es la dependencia CommonJS permitida.
- `npm run build:prod` tambien ejecuta `verify:bundle`.

## Riesgo de configuracion

Los secretos Winder estan compilados en los archivos de entorno. Aunque no exista `devUser` en produccion, un secreto incluido en JavaScript descargable no es confidencial. La remediacion requiere cambiar el modelo del backend, no solo mover la cadena a otro archivo.
